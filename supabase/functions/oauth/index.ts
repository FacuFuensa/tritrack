// Edge Function `oauth` (contrato C2): el OAuth de Strava y Whoop se hace
// entero en el servidor. La app nunca ve un client_secret ni un código.
//
//   POST /oauth/start {provider}       JWT → {url} con un nonce en `state`
//   GET  /oauth/callback/:provider     el proveedor vuelve acá → 302 a tritrack://oauth?...
//   POST /oauth/disconnect {provider}  JWT → revoca (si puede) y borra el token
//
// verify_jwt=false: el callback llega desde el navegador del proveedor, sin
// sesión. Por eso el usuario viaja en `state` (patrón del fix de iOS 56371c6),
// y /start y /disconnect validan el JWT a mano.
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { adminClient, cors, json, userFromJwt } from "../_shared/http.ts";
import {
  appRedirect,
  authorizeUrl,
  callbackUrl,
  checkState,
  isProvider,
  newNonce,
  parseRoute,
  type Provider,
  STATE_TTL_MS,
} from "./logic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API = "https://api.prod.whoop.com/developer";

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

async function config(admin: SupabaseClient, provider: Provider) {
  const { data } = await admin.from(`${provider}_config`).select("client_id, client_secret").single();
  return data as { client_id: string; client_secret: string } | null;
}

async function start(admin: SupabaseClient, req: Request) {
  const userId = await userFromJwt(admin, req);
  if (!userId) return json({ error: "unauthorized" }, 401);

  const { provider } = await req.json().catch(() => ({}));
  if (!isProvider(provider)) return json({ error: "invalid_provider" }, 400);

  const cfg = await config(admin, provider);
  if (!cfg) return json({ error: "no_config" }, 500);

  // Limpieza de paso: los nonces vencidos no sirven para nada.
  await admin.from("oauth_states").delete()
    .lt("created_at", new Date(Date.now() - STATE_TTL_MS).toISOString());

  const nonce = newNonce();
  const { error } = await admin.from("oauth_states").insert({ nonce, user_id: userId, provider });
  if (error) return json({ error: "state_insert" }, 500);

  return json({ url: authorizeUrl(provider, cfg.client_id, nonce, SUPABASE_URL) });
}

// Intercambia el código y deja el token guardado. Columnas iguales a las que
// leen strava-sync y whoop-sync. Devuelve un código de error corto o null.
async function exchange(
  admin: SupabaseClient,
  provider: Provider,
  userId: string,
  code: string,
  grantedScope: string | null,
): Promise<string | null> {
  const cfg = await config(admin, provider);
  if (!cfg) return "no_config";
  const now = new Date().toISOString();

  if (provider === "strava") {
    const r = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: cfg.client_id, client_secret: cfg.client_secret,
        code, grant_type: "authorization_code",
      }),
    });
    if (!r.ok) return "token_exchange";
    const tok = await r.json();
    const { error } = await admin.from("strava_tokens").upsert({
      user_id: userId,
      athlete_id: tok.athlete?.id ?? null,
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: tok.expires_at,
      // Strava no devuelve el scope en el token: viene en el callback, y es lo
      // que el usuario dejó tildado.
      scope: grantedScope,
      updated_at: now,
    }, { onConflict: "user_id" });
    return error ? "token_save" : null;
  }

  // Whoop: form-encoded y con el mismo redirect_uri del authorize.
  const r = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl("whoop", SUPABASE_URL),
      client_id: cfg.client_id,
      client_secret: cfg.client_secret,
    }),
  });
  if (!r.ok) return "token_exchange";
  const tok = await r.json();

  // El id de Whoop sirve para depurar; si falla no rompe la conexión.
  let whoopUserId: string | null = null;
  try {
    const me = await fetch(`${WHOOP_API}/v2/user/profile/basic`, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    if (me.ok) whoopUserId = String((await me.json()).user_id ?? "") || null;
  } catch { /* ignorar */ }

  const { error } = await admin.from("whoop_tokens").upsert({
    user_id: userId,
    whoop_user_id: whoopUserId,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (tok.expires_in ?? 3600),
    scope: tok.scope ?? null,
    updated_at: now,
  }, { onConflict: "user_id" });
  return error ? "token_save" : null;
}

async function callback(admin: SupabaseClient, url: URL, provider: Provider | null) {
  if (!provider) return redirect(appRedirect(null, false, "invalid_provider"));

  const q = url.searchParams;
  // El usuario tocó "Cancelar" en la pantalla del proveedor.
  if (q.get("error")) return redirect(appRedirect(provider, false, "denied"));

  const code = q.get("code");
  const nonce = q.get("state");
  if (!code || !nonce) return redirect(appRedirect(provider, false, "missing_code"));

  // Borrar y leer en un solo paso: un nonce se usa una vez.
  const { data: row } = await admin.from("oauth_states").delete()
    .eq("nonce", nonce).select("user_id, provider, created_at").maybeSingle();
  const state = checkState(row, provider, Date.now());
  if (!state.ok) return redirect(appRedirect(provider, false, state.error));

  const err = await exchange(admin, provider, state.userId, code, q.get("scope"));
  return redirect(appRedirect(provider, !err, err ?? undefined));
}

// Revocar en el proveedor es un extra: si falla igual se borra el token, que
// es lo que deja la app "desconectada".
async function disconnect(admin: SupabaseClient, req: Request) {
  const userId = await userFromJwt(admin, req);
  if (!userId) return json({ error: "unauthorized" }, 401);

  const { provider } = await req.json().catch(() => ({}));
  if (!isProvider(provider)) return json({ error: "invalid_provider" }, 400);

  const table = `${provider}_tokens`;
  const { data: tok } = await admin.from(table).select("access_token").eq("user_id", userId).maybeSingle();
  if (tok?.access_token) {
    try {
      if (provider === "strava") {
        await fetch("https://www.strava.com/oauth/deauthorize", {
          method: "POST",
          headers: { Authorization: `Bearer ${tok.access_token}` },
        });
      } else {
        await fetch(`${WHOOP_API}/v2/user/access`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${tok.access_token}` },
        });
      }
    } catch { /* ignorar */ }
  }

  const { error } = await admin.from(table).delete().eq("user_id", userId);
  if (error) return json({ error: "delete_failed" }, 500);
  return json({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const route = parseRoute(req.method, url.pathname);
  const admin = adminClient();

  try {
    switch (route.kind) {
      case "start": return await start(admin, req);
      case "disconnect": return await disconnect(admin, req);
      case "callback": return await callback(admin, url, route.provider);
      default: return json({ error: "not_found" }, 404);
    }
  } catch (e) {
    console.error("oauth", route.kind, e);
    // El callback lo ve el usuario en el navegador: nunca un 500 con HTML.
    if (route.kind === "callback") {
      return redirect(appRedirect(route.provider, false, "server_error"));
    }
    return json({ error: "server_error" }, 500);
  }
});

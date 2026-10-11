// Edge Function: intercambia el `code` de OAuth de WHOOP por tokens y los guarda.
// verify_jwt=false a nivel gateway (para no bloquear el preflight CORS del navegador);
// la autenticación se hace acá adentro con admin.auth.getUser(jwt).
//
// Diferencias con strava-auth que importan:
//  - WHOOP usa form-encoded en el token endpoint (OAuth2 estándar), no JSON.
//  - Exige `redirect_uri` en el intercambio, y tiene que ser idéntico al que se
//    usó al pedir el code.
//  - Rota el refresh token en cada renovación (ver whoop-sync).
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const API = "https://api.prod.whoop.com/developer";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
  const userId = userData.user.id;

  const { code, redirect_uri } = await req.json().catch(() => ({}));
  if (!code) return json({ error: "missing code" }, 400);
  if (!redirect_uri) return json({ error: "missing redirect_uri" }, 400);

  const { data: cfg } = await admin.from("whoop_config").select("*").single();
  if (!cfg) return json({ error: "no whoop config" }, 500);

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri,
      client_id: cfg.client_id,
      client_secret: cfg.client_secret,
    }),
  });
  if (!tokenRes.ok) {
    return json({ error: "token exchange failed", detail: await tokenRes.text() }, 502);
  }
  const tok = await tokenRes.json();

  // El id de usuario de WHOOP es útil para depurar; si falla no rompemos la conexión.
  let whoopUserId: string | null = null;
  try {
    const me = await fetch(`${API}/v2/user/profile/basic`, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    if (me.ok) whoopUserId = String((await me.json()).user_id ?? "");
  } catch { /* ignorar */ }

  await admin.from("whoop_tokens").upsert({
    user_id: userId,
    whoop_user_id: whoopUserId,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (tok.expires_in ?? 3600),
    scope: tok.scope ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return json({ ok: true, whoop_user_id: whoopUserId });
});

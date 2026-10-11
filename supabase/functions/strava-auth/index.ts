// Edge Function: intercambia el `code` de OAuth de Strava por tokens y los guarda.
// verify_jwt=false a nivel gateway (para no bloquear el preflight CORS del navegador);
// la autenticación se hace acá adentro con admin.auth.getUser(jwt).
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  const { code } = await req.json().catch(() => ({}));
  if (!code) return json({ error: "missing code" }, 400);

  const { data: cfg } = await admin.from("strava_config").select("*").single();
  if (!cfg) return json({ error: "no strava config" }, 500);

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: cfg.client_id,
      client_secret: cfg.client_secret,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return json({ error: "token exchange failed", detail: await tokenRes.text() }, 502);
  }
  const tok = await tokenRes.json();

  await admin.from("strava_tokens").upsert({
    user_id: userId,
    athlete_id: tok.athlete?.id ?? null,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: tok.expires_at,
    scope: tok.scope ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // Las zonas ya vienen personalizadas en PLAN.zones (js/plan.js); no las tocamos.
  return json({ ok: true, athlete_id: tok.athlete?.id ?? null });
});

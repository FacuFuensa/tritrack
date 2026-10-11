// Edge Function `notify` (contrato C2): manda una notificación a todos los
// push_tokens de un usuario por Expo Push.
//
//   POST {user_id, title, body, url?}
//
// Dos formas de llamarla:
//  - header x-notify-secret (servidor: triggers con pg_net, strava-webhook)
//    → manda a `user_id`.
//  - JWT del usuario (el botón "Probar notificación" de Ajustes) → solo puede
//    notificarse a sí mismo: `user_id` se ignora. La app nunca ve el secreto.
//
// verify_jwt=false: pg_net llama sin JWT; la auth se hace acá adentro.
import { adminClient, cors, hasNotifySecret, json, userFromJwt } from "../_shared/http.ts";
import { buildMessages, deadTokens, parsePayload } from "./logic.ts";

const EXPO_PUSH = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "not_found" }, 404);

  const admin = adminClient();
  const input = await req.json().catch(() => null);

  const userId = hasNotifySecret(req)
    ? (typeof input?.user_id === "string" ? input.user_id : null)
    : await userFromJwt(admin, req);
  if (!userId) return json({ error: "unauthorized" }, 401);

  const payload = parsePayload(input);
  if (!payload) return json({ error: "title y body son obligatorios" }, 400);

  const { data: rows, error } = await admin.from("push_tokens")
    .select("expo_token").eq("user_id", userId);
  if (error) return json({ error: "push_tokens", detail: error.message }, 500);
  const tokens = (rows ?? []).map((r) => r.expo_token as string);
  if (!tokens.length) return json({ sent: 0, removed: 0 });

  // Expo acepta hasta 100 mensajes por pedido.
  let sent = 0, removed = 0;
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const r = await fetch(EXPO_PUSH, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(buildMessages(batch, payload)),
    });
    if (!r.ok) return json({ error: "expo_push", status: r.status, detail: (await r.text()).slice(0, 200) }, 502);
    const tickets = (await r.json()).data;
    sent += Array.isArray(tickets) ? tickets.filter((t: { status?: string }) => t.status === "ok").length : 0;

    const dead = deadTokens(batch, tickets);
    if (dead.length) {
      await admin.from("push_tokens").delete().eq("user_id", userId).in("expo_token", dead);
      removed += dead.length;
    }
  }

  return json({ sent, removed });
});

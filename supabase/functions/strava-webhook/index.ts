// Edge Function `strava-webhook` (contrato C2).
//
//   GET  ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…
//        → {"hub.challenge": …}   (Strava exige respuesta en < 2 s)
//   POST evento de Strava → 200 enseguida; en segundo plano: trae esa
//        actividad, la escribe en `activities`, la matchea con plan_sessions
//        y manda "¿Cómo te fue en …?" por `notify`.
//
// verify_jwt=false: Strava llama sin JWT. Un POST falso solo puede hacer que
// se vuelva a leer de Strava una actividad real del dueño del token, y la
// notificación sale solo la primera vez que esa actividad entra a la base.
import { adminClient, json } from "../_shared/http.ts";
import { applyMatches, markBroken, stravaAccessToken } from "../_shared/strava.ts";
import { toActivityRow } from "../strava-sync/mapping.ts";
import { checkinNotification, expectedVerifyToken, parseEvent, type StravaEvent, verifyChallenge } from "./logic.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

async function handleCreate(ev: StravaEvent) {
  const admin = adminClient();
  const { data: owner } = await admin.from("strava_tokens")
    .select("user_id").eq("athlete_id", ev.athleteId).maybeSingle();
  if (!owner) return console.log("webhook: atleta sin usuario", ev.athleteId);
  const userId = owner.user_id as string;

  const tok = await stravaAccessToken(admin, userId);
  if (!tok.ok) return console.log("webhook: sin token", tok.reason);

  const r = await fetch(`https://www.strava.com/api/v3/activities/${ev.activityId}`, {
    headers: { Authorization: `Bearer ${tok.accessToken}` },
  });
  if (r.status === 401) return await markBroken(admin, userId);
  if (!r.ok) return console.log("webhook: actividad", r.status);
  const activity = await r.json();
  const row = toActivityRow(userId, activity);

  const { data: before } = await admin.from("activities").select("external_id")
    .eq("user_id", userId).eq("source", "strava").eq("external_id", row.external_id).maybeSingle();
  const { error } = await admin.from("activities")
    .upsert(row, { onConflict: "user_id,source,external_id" });
  if (error) return console.log("webhook: upsert", error.message);

  const session = (await applyMatches(admin, userId, [row])).get(row.external_id) ?? null;
  if (before) return; // ya estaba: no se notifica dos veces

  const n = checkinNotification(session, { external_id: row.external_id, name: activity.name ?? null });
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-notify-secret": Deno.env.get("NOTIFY_SECRET") ?? "" },
    body: JSON.stringify({ user_id: userId, ...n }),
  });
  console.log("webhook: notify", res.status, await res.text());
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const expected = await expectedVerifyToken({
      STRAVA_VERIFY_TOKEN: Deno.env.get("STRAVA_VERIFY_TOKEN"),
      NOTIFY_SECRET: Deno.env.get("NOTIFY_SECRET"),
    });
    const challenge = verifyChallenge(url.searchParams, expected);
    return challenge == null ? json({ error: "forbidden" }, 403) : json({ "hub.challenge": challenge });
  }

  if (req.method !== "POST") return json({ error: "not_found" }, 404);
  const ev = parseEvent(await req.json().catch(() => null));
  if (ev) {
    const work = handleCreate(ev).catch((e) => console.error("webhook:", e));
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
    else await work;
  }
  // Strava reintenta si no recibe 200 rápido.
  return json({ ok: true });
});

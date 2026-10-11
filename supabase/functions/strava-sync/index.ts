// Edge Function: trae las actividades de Strava, escribe TODAS en `activities`
// y además sigue auto-marcando el workout_log de la PWA vieja (por ahora).
// Auth: JWT del usuario, o x-notify-secret + {user_id} (contrato C2).
// verify_jwt=false a nivel gateway (CORS preflight); auth adentro.
//
// POST {days?: number} (default 14, máx. 90) → {fetched, upserted, matched}
// Refresh muerto o acceso revocado → 409 {error: 'reauth'} y la conexión
// queda marcada como rota, sin borrar el token.
import { adminClient, cors, hasNotifySecret, json, userFromJwt } from "../_shared/http.ts";
import { brokenScope } from "../_shared/connection.ts";
import { clampDays, toActivityRow } from "./mapping.ts";

// Disciplina de cada session_id. Es lo unico que el sync necesita saber del
// catalogo de js/plan.js: el resto (ejercicios, cues, estructura) es del front.
const DISC: Record<string, string> = {
  gymA: "gym", gymB: "gym", gymAShort: "gym", gymBShort: "gym",
  swimTech: "swim", swimIntervals: "swim", swimContinuous: "swim", swimOpenWater: "swim",
  bikeIntervals: "bike", bikeEasy: "bike", bikeLong: "bike", bikeCommute: "bike",
  runClub: "run", runQuality: "run", runLong: "run", runLongWalk: "run",
  brick: "brick", raceDay: "brick",
};

// Semana tipo, SOLO para usuarios sin bloque sembrado. Espeja el fallback de
// js/schedule.js. Cuando hay bloque activo manda plan_sessions y esto no se
// usa, asi que ya no hay que mantenerlo en sync con cada cambio de plan.
const FALLBACK_WEEK: string[][] = [
  ["swimTech", "gymA"],
  ["runClub", "bikeCommute"],
  ["runQuality", "swimIntervals"],
  ["gymB", "bikeIntervals"],
  ["swimContinuous"],
  ["bikeLong", "brick"],
  ["runLong"],
];

const MAP: Record<string, string> = {
  Run: "run", TrailRun: "run", VirtualRun: "run",
  Ride: "bike", VirtualRide: "bike", GravelRide: "bike", MountainBikeRide: "bike",
  Swim: "swim", WeightTraining: "gym", Workout: "gym", Crossfit: "gym",
};

function chicagoDate(iso: string): { date: string; dow: number } {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dowMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return { date: `${get("year")}-${get("month")}-${get("day")}`, dow: dowMap[get("weekday")] ?? 0 };
}

// Nadando el ritmo se mide cada 100 m; corriendo, cada km.
function pace(disc: string, distanceM: number, movingS: number) {
  if (!distanceM || !movingS) return { pace: null, pace_unit: null };
  const per = disc === "swim" ? 100 : 1000;
  const sec = movingS / (distanceM / per);
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return {
    pace: `${m}:${String(s).padStart(2, "0")}`,
    pace_unit: disc === "swim" ? "/100m" : "/km",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = adminClient();
  const body = await req.json().catch(() => ({}));

  const userId = hasNotifySecret(req)
    ? (typeof body.user_id === "string" ? body.user_id : null)
    : await userFromJwt(admin, req);
  if (!userId) return json({ error: "unauthorized" }, 401);
  const days = clampDays(body.days);

  const { data: tokens } = await admin.from("strava_tokens").select("*").eq("user_id", userId).maybeSingle();
  if (!tokens) return json({ error: "not connected" }, 400);

  // Conexión rota: se marca y se avisa con 409 para que la app ofrezca
  // "Reconectar". El token no se borra: el próximo OAuth lo pisa.
  const reauth = async () => {
    await admin.from("strava_tokens").update({ scope: brokenScope(tokens.scope) }).eq("user_id", userId);
    return json({ error: "reauth" }, 409);
  };

  let accessToken = tokens.access_token;
  if (tokens.expires_at <= Math.floor(Date.now() / 1000) + 60) {
    const { data: cfg } = await admin.from("strava_config").select("*").single();
    if (!cfg) return json({ error: "no strava config" }, 500);
    const r = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: cfg.client_id, client_secret: cfg.client_secret,
        grant_type: "refresh_token", refresh_token: tokens.refresh_token,
      }),
    });
    // 400/401: el refresh token ya no sirve (revocado o inválido).
    if (r.status === 400 || r.status === 401) return await reauth();
    if (!r.ok) return json({ error: "refresh failed" }, 502);
    const nt = await r.json();
    accessToken = nt.access_token;
    await admin.from("strava_tokens").update({
      access_token: nt.access_token, refresh_token: nt.refresh_token,
      expires_at: nt.expires_at, updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  // Strava pagina de a 200 como máximo; 90 días pueden ser más.
  const after = Math.floor(Date.now() / 1000) - days * 86400;
  // deno-lint-ignore no-explicit-any
  const activities: any[] = [];
  for (let page = 1; page <= 10; page++) {
    const actRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (actRes.status === 401) return await reauth();
    if (!actRes.ok) return json({ error: "activities failed" }, 502);
    const batch = await actRes.json();
    activities.push(...batch);
    if (batch.length < 200) break;
  }

  // Todas las actividades a `activities`, sin filtrar por disciplina.
  let upserted = 0;
  if (activities.length) {
    const rows = activities.map((a) => toActivityRow(userId, a));
    const { error } = await admin.from("activities")
      .upsert(rows, { onConflict: "user_id,source,external_id" });
    if (error) return json({ error: "upsert failed", detail: error.message }, 500);
    upserted = rows.length;
  }

  // Sesiones que el usuario desmarcó a mano ("Deshacer" sobre una que registró
  // Strava). Sin esto el sync las vuelve a marcar en la próxima pasada y el
  // botón Deshacer no sirve para nada.
  const sinceISO = new Date(after * 1000).toISOString().slice(0, 10);
  const { data: existing } = await admin.from("workout_log")
    .select("date, session_id, exercises")
    .eq("user_id", userId)
    .gte("date", sinceISO);
  const dismissed = new Set(
    (existing ?? [])
      .filter((r) => r.exercises?._stravaOff)
      .map((r) => `${r.date}:${r.session_id}`),
  );

  // El plan vive en plan_sessions. Traemos la ventana que mira el sync y
  // armamos fecha -> [session_id]. Si el usuario no tiene bloque activo,
  // planByDate queda vacio y se usa FALLBACK_WEEK, igual que en el front.
  const { data: block } = await admin.from("plan_blocks")
    .select("id").eq("user_id", userId).eq("active", true).maybeSingle();

  const planByDate: Record<string, string[]> = {};
  if (block) {
    const { data: planRows } = await admin.from("plan_sessions")
      .select("date, session_id, order_index")
      .eq("user_id", userId)
      .gte("date", sinceISO)
      .order("order_index");
    for (const r of planRows ?? []) (planByDate[r.date] ??= []).push(r.session_id);
  }

  const usedByDate: Record<string, Set<string>> = {};
  let matched = 0;
  // deno-lint-ignore no-explicit-any
  const recent: any[] = [];

  for (const a of activities) {
    const disc = MAP[a.sport_type] || MAP[a.type];
    const startISO = a.start_date;
    const { date, dow } = chicagoDate(startISO);
    const metrics = {
      strava_id: a.id,
      name: a.name,
      distance_m: a.distance,
      moving_s: a.moving_time,
      ...(disc === "run" || disc === "swim"
        ? pace(disc, a.distance, a.moving_time)
        : { pace: null, pace_unit: null }),
      avg_watts: a.average_watts ?? null,
      avg_hr: a.average_heartrate ?? null,
      sport: a.sport_type,
    };
    recent.push({ date, disc, name: a.name, distance_m: a.distance, moving_s: a.moving_time });

    if (!disc) continue;
    // Con bloque activo manda el plan sembrado; si un dia del bloque no tiene
    // sesiones es descanso y no hay match. Sin bloque, la semana tipo.
    const daySessions = block ? (planByDate[date] ?? []) : (FALLBACK_WEEK[dow] ?? []);
    const candidates = daySessions.filter((id) => DISC[id] === disc);
    if (!usedByDate[date]) usedByDate[date] = new Set();
    const sessionId = candidates.find((id) =>
      !usedByDate[date].has(id) && !dismissed.has(`${date}:${id}`));
    if (!sessionId) continue;
    usedByDate[date].add(sessionId);

    const { error } = await admin.from("workout_log").upsert({
      user_id: userId, date, session_id: sessionId,
      status: "done", source: "strava", metrics,
      done_at: startISO,
    }, { onConflict: "user_id,date,session_id" });
    if (!error) matched++;
  }

  // updated_at es "la última vez que la conexión anduvo": Ajustes lo muestra
  // como última sincronización.
  await admin.from("strava_tokens").update({ updated_at: new Date().toISOString() }).eq("user_id", userId);

  return json({ fetched: activities.length, upserted, matched, recent: recent.slice(0, 20) });
});

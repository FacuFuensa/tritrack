// Edge Function: arma y envía los recordatorios push.
// Modos: "morning" (qué toca hoy) y "evening" (recordatorio de lo no marcado;
// los domingos manda el resumen semanal en su lugar).
// Protegida por la clave compartida de push_config (header x-tc-key).
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush";

type Slot = { id: string; t: string; opt: boolean };
type Plan = Record<string, Slot[]>;   // fecha -> sesiones
type Race = { name: string; date: string };

// Titulo corto de cada sesion para el push. El catalogo completo vive en el
// front; aca solo hace falta una linea por sesion.
const TITLE: Record<string, string> = {
  gymA: "🏋️ Gym A (inferior)", gymB: "🏋️ Gym B (superior)",
  gymAShort: "🏋️ Gym A — isquio (25 min)", gymBShort: "🏋️ Gym B — hombro (20 min)",
  swimTech: "🏊 Natación técnica", swimIntervals: "🏊 Natación intervalos",
  swimContinuous: "🏊 Natación continua o descanso", swimOpenWater: "🏊 Aguas abiertas",
  bikeIntervals: "🚴 Bici intervalos", bikeEasy: "🚴 Bici suave",
  bikeLong: "🚴 Fondo de bici", bikeCommute: "🚴 Bici al club",
  runClub: "🏃 Club de running", runQuality: "🏃 Carrera calidad",
  runLong: "🏃 Fondo de carrera", runLongWalk: "🏃 Fondo run/walk",
  brick: "🔁 Brick", raceDay: "🏁 IRONMAN 70.3 WACO",
};

// Semana tipo, SOLO para usuarios sin bloque sembrado. Espeja el fallback de
// js/schedule.js. Con bloque activo manda plan_sessions y esto no se usa.
const FALLBACK_WEEK: { id: string; opt?: boolean }[][] = [
  [{ id: "swimTech" }, { id: "gymA" }],
  [{ id: "runClub" }, { id: "bikeCommute", opt: true }],
  [{ id: "runQuality" }, { id: "swimIntervals" }],
  [{ id: "gymB" }, { id: "bikeIntervals" }],
  [{ id: "swimContinuous" }],
  [{ id: "bikeLong" }, { id: "brick" }],
  [{ id: "runLong" }],
];

const label = (id: string) => TITLE[id] ?? id;

function fallbackDay(dow: number): Slot[] {
  return (FALLBACK_WEEK[dow] ?? []).map(s => ({ id: s.id, t: label(s.id), opt: !!s.opt }));
}

const DAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DEFAULT_ANCHOR = "2026-06-08";

// ---- Fechas en hora de Waco (America/Chicago) ----

function chicagoToday(): { iso: string; dow: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  const iso = `${get("year")}-${get("month")}-${get("day")}`;
  const dowMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return { iso, dow: dowMap[get("weekday")] ?? 0 };
}

function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

function diffDaysISO(a: string, b: string): number {
  const toUTC = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(a) - toUTC(b)) / 86400000);
}

// ---- Composición de mensajes ----

type Log = Record<string, Record<string, string>>; // fecha -> sesión -> status

function composeMorning(
  todayISO: string, dow: number, monday: string, anchor: string,
  plan: Plan, races: Race[], wk: { index: number; kind: string; focus: string } | null,
) {
  const race = races.find(r => r.date === todayISO);
  if (race) {
    return {
      title: "🏁 ¡Día de carrera!",
      body: `Hoy es ${race.name}. Confiá en el entrenamiento y a romperla 💪`,
      tag: "tc-morning",
    };
  }

  const day = plan[todayISO] ?? [];
  if (day.length === 0) {
    return {
      title: `Día libre · ${DAYS[dow]}`,
      body: "Descanso. También entrena 😴",
      tag: "tc-morning",
    };
  }

  const lines = [day.map(s => s.t + (s.opt ? " (opcional)" : "")).join(" + ")];

  // Con bloque sembrado el foco sale del plan; si no, de la regla vieja.
  if (wk) {
    if (wk.kind === "race") lines.push("🏁 Semana de carrera: nada nuevo. Ni comida, ni equipo, ni zapatillas.");
    else if (wk.focus) lines.push(`Semana ${wk.index} — ${wk.focus}`);
  } else {
    const raceWeek = races.find(r => diffDaysISO(r.date, monday) >= 0 && diffDaysISO(r.date, monday) <= 6);
    const weekNum = Math.floor(diffDaysISO(monday, anchor) / 7) + 1;
    if (raceWeek) {
      lines.push(`🏁 Semana de ${raceWeek.name}: bajá cargas, solo activaciones cerca de la carrera.`);
    } else if (weekNum > 0 && weekNum % 4 === 0) {
      lines.push("🪫 Semana de descarga: 2 series en vez de 3, −30-40% de volumen.");
    }
  }

  return {
    title: `Hoy te toca · ${DAYS[dow]}`,
    body: lines.join("\n"),
    tag: "tc-morning",
  };
}

function composeEvening(todayISO: string, dow: number, log: Log, plan: Plan) {
  const unresolved = (plan[todayISO] ?? [])
    .filter(s => !s.opt && !log[todayISO]?.[s.id])
    .map(s => s.t);
  if (unresolved.length === 0) return null; // día completo: no molestamos
  return {
    title: "¿Cómo fue el día?",
    body: `Te queda sin marcar: ${unresolved.join(", ")}. Si lo hiciste, entrá y marcalo.`,
    tag: "tc-evening",
  };
}

function composeWeekly(
  monday: string, anchor: string, log: Log, plan: Plan,
  wk: { index: number; kind: string; focus: string } | null,
) {
  let scheduled = 0, done = 0;
  const missing: string[] = [];
  let gymA = false, gymB = false;
  for (let i = 0; i < 7; i++) {
    const iso = addDaysISO(monday, i);
    for (const s of plan[iso] ?? []) {
      if (s.opt) continue;
      scheduled++;
      const st = log[iso]?.[s.id];
      if (st === "done") {
        done++;
        if (s.id === "gymA" || s.id === "gymAShort") gymA = true;
        if (s.id === "gymB" || s.id === "gymBShort") gymB = true;
      } else {
        missing.push(s.t);
      }
    }
  }
  const weekNum = wk?.index ?? (Math.floor(diffDaysISO(monday, anchor) / 7) + 1);
  const lines = [`${done}/${scheduled} sesiones ✓`];
  lines.push(gymA && gymB
    ? "🏋️ Las 2 de gym completas — el isquio te lo agradece 💪"
    : "⚠️ Te faltó gym esta semana. Con tu isquio, que no se repita la que viene.");
  if (missing.length > 0 && missing.length <= 4) lines.push(`Quedaron: ${missing.join(", ")}`);
  return {
    title: `Resumen semana ${weekNum}`,
    body: lines.join("\n"),
    tag: "tc-weekly",
  };
}

// ---- Handler ----

Deno.serve(async (req: Request) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: cfg, error: cfgErr } = await admin.from("push_config").select("*").single();
  if (cfgErr || !cfg) return Response.json({ error: "no config" }, { status: 500 });
  if (req.headers.get("x-tc-key") !== cfg.shared_key) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { mode = "morning" } = await req.json().catch(() => ({}));
  const { iso: todayISO, dow } = chicagoToday();
  const monday = addDaysISO(todayISO, -dow);

  const vapidKeys = await webpush.importVapidKeys(cfg.vapid_keys, { extractable: false });
  const appServer = await webpush.ApplicationServer.new({
    // El contacto VAPID es un dato personal: vive en los secrets, no en el repo.
    contactInformation: Deno.env.get("VAPID_CONTACT") ?? "mailto:admin@example.com",
    vapidKeys,
  });

  const { data: subs } = await admin.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) return Response.json({ mode, users: 0, sent: 0 });

  const byUser = new Map<string, typeof subs>();
  for (const s of subs) {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
    byUser.get(s.user_id)!.push(s);
  }

  let sent = 0, cleaned = 0;
  const errors: { endpoint: string; detail: string }[] = [];

  for (const [userId, userSubs] of byUser) {
    const { data: settings } = await admin.from("settings")
      .select("anchor_monday").eq("user_id", userId).maybeSingle();
    const anchor = settings?.anchor_monday ?? DEFAULT_ANCHOR;

    const { data: rows } = await admin.from("workout_log")
      .select("date, session_id, status")
      .eq("user_id", userId)
      .gte("date", monday)
      .lte("date", addDaysISO(monday, 6));
    const log: Log = {};
    for (const r of rows ?? []) {
      (log[r.date] ??= {})[r.session_id] = r.status;
    }

    // El plan de la semana sale de plan_sessions. Sin bloque activo, la
    // semana tipo, igual que hace js/schedule.js en el front.
    const { data: block } = await admin.from("plan_blocks")
      .select("id, event_name, event_date")
      .eq("user_id", userId).eq("active", true).maybeSingle();

    const plan: Plan = {};
    let wk: { index: number; kind: string; focus: string } | null = null;

    if (block) {
      const { data: planRows } = await admin.from("plan_sessions")
        .select("date, session_id, optional, order_index")
        .eq("user_id", userId)
        .gte("date", monday).lte("date", addDaysISO(monday, 6))
        .order("order_index");
      for (const r of planRows ?? []) {
        (plan[r.date] ??= []).push({ id: r.session_id, t: label(r.session_id), opt: !!r.optional });
      }
      const { data: weekRow } = await admin.from("plan_weeks")
        .select("week_index, kind, focus")
        .eq("user_id", userId).eq("monday", monday).maybeSingle();
      if (weekRow) wk = { index: weekRow.week_index, kind: weekRow.kind, focus: weekRow.focus ?? "" };
    } else {
      for (let i = 0; i < 7; i++) plan[addDaysISO(monday, i)] = fallbackDay(i);
    }

    const races: Race[] = block?.event_date
      ? [{ name: block.event_name ?? "tu carrera", date: block.event_date }]
      : [{ name: "IRONMAN 70.3 Waco", date: "2026-10-04" }];

    let msg;
    if (mode === "evening") {
      msg = dow === 6 ? composeWeekly(monday, anchor, log, plan, wk) : composeEvening(todayISO, dow, log, plan);
    } else {
      msg = composeMorning(todayISO, dow, monday, anchor, plan, races, wk);
    }
    if (!msg) continue;

    for (const sub of userSubs) {
      try {
        const subscriber = appServer.subscribe({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        });
        await subscriber.pushTextMessage(JSON.stringify(msg), {});
        sent++;
      } catch (err) {
        const status = err instanceof webpush.PushMessageError ? err.response?.status : undefined;
        if (status === 404 || status === 410) {
          // suscripción muerta: el dispositivo se dio de baja
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          cleaned++;
        } else {
          errors.push({ endpoint: sub.endpoint.slice(0, 60), detail: `${status ?? ""} ${err}`.trim().slice(0, 200) });
        }
      }
    }
  }

  return Response.json({ mode, users: byUser.size, sent, cleaned, errors });
});

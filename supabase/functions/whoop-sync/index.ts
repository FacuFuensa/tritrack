// Edge Function: trae recuperación, sueño y strain de WHOOP y los guarda en
// recovery_daily, una fila por día.
// verify_jwt=false a nivel gateway (CORS preflight); auth adentro con getUser.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const API = "https://api.prod.whoop.com/developer";
const DAYS = 30;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

// La fecha del día de entrenamiento es la de Waco, no UTC: un sueño que
// termina a las 6 AM del martes en Texas es UTC del martes 11:00, pero uno
// que termina a las 23:00 del lunes seria martes en UTC y lunes acá.
function chicagoDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso));
}

// WHOOP pagina de a 25 como máximo. Traemos todo el rango siguiendo nextToken.
async function fetchAll(path: string, token: string, startISO: string) {
  const out: any[] = [];
  let next: string | undefined;
  for (let guard = 0; guard < 20; guard++) {
    const url = new URL(`${API}${path}`);
    url.searchParams.set("limit", "25");
    url.searchParams.set("start", startISO);
    if (next) url.searchParams.set("nextToken", next);
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`${path} ${r.status}: ${(await r.text()).slice(0, 120)}`);
    const body = await r.json();
    out.push(...(body.records ?? []));
    next = body.next_token ?? undefined;
    if (!next) break;
  }
  return out;
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

  const { data: tokens } = await admin.from("whoop_tokens").select("*").eq("user_id", userId).maybeSingle();
  if (!tokens) return json({ error: "not connected" }, 400);

  let accessToken = tokens.access_token;

  // WHOOP ROTA el refresh token: el de la respuesta reemplaza al anterior y el
  // viejo queda muerto. Si no se persiste el nuevo, la conexión se pierde en
  // la siguiente renovación y hay que rehacer todo el OAuth desde el celular.
  if (tokens.expires_at <= Math.floor(Date.now() / 1000) + 60) {
    const { data: cfg } = await admin.from("whoop_config").select("*").single();
    if (!cfg) return json({ error: "no whoop config" }, 500);
    const r = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
        client_id: cfg.client_id,
        client_secret: cfg.client_secret,
        scope: "offline",
      }),
    });
    if (!r.ok) return json({ error: "refresh failed", detail: (await r.text()).slice(0, 200) }, 502);
    const nt = await r.json();
    accessToken = nt.access_token;
    await admin.from("whoop_tokens").update({
      access_token: nt.access_token,
      refresh_token: nt.refresh_token ?? tokens.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (nt.expires_in ?? 3600),
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  const startISO = new Date(Date.now() - DAYS * 86400_000).toISOString();

  let sleeps: any[], recoveries: any[], cycles: any[];
  try {
    [sleeps, recoveries, cycles] = await Promise.all([
      fetchAll("/v2/activity/sleep", accessToken, startISO),
      fetchAll("/v2/recovery", accessToken, startISO),
      fetchAll("/v2/cycle", accessToken, startISO),
    ]);
  } catch (e) {
    return json({ error: "whoop fetch failed", detail: String(e).slice(0, 200) }, 502);
  }

  // Una fila por día. La recuperación se atribuye al día en que te despertás,
  // que es el día que vas a entrenar.
  type Row = Record<string, unknown> & { user_id: string; date: string };
  const byDate = new Map<string, Row>();
  const row = (date: string): Row => {
    if (!byDate.has(date)) byDate.set(date, { user_id: userId, date, source: "whoop" });
    return byDate.get(date)!;
  };

  // Sueño: performance y horas dormidas (en cama menos despierto).
  const sleepDate = new Map<string, string>();   // sleep id -> fecha
  for (const s of sleeps) {
    if (s.nap) continue;                          // las siestas no definen el día
    const date = chicagoDate(s.end);
    sleepDate.set(String(s.id), date);
    const sc = s.score ?? {};
    const st = sc.stage_summary ?? {};
    const dormidoMs = (st.total_light_sleep_time_milli ?? 0)
      + (st.total_slow_wave_sleep_time_milli ?? 0)
      + (st.total_rem_sleep_time_milli ?? 0);
    const r = row(date);
    if (sc.sleep_performance_percentage != null) r.sleep_perf_pct = Math.round(sc.sleep_performance_percentage);
    if (dormidoMs > 0) r.sleep_h = Number((dormidoMs / 3600000).toFixed(2));
  }

  // Recuperación: se ata al sueño del que salió (en v2 viene por sleep_id).
  for (const rec of recoveries) {
    const date = sleepDate.get(String(rec.sleep_id)) ?? chicagoDate(rec.created_at);
    const sc = rec.score ?? {};
    if (sc.user_calibrating) continue;            // WHOOP todavía no tiene baseline
    const r = row(date);
    if (sc.recovery_score != null) r.recovery_pct = Math.round(sc.recovery_score);
    if (sc.hrv_rmssd_milli != null) r.hrv_ms = Number(sc.hrv_rmssd_milli.toFixed(2));
    if (sc.resting_heart_rate != null) r.rhr_bpm = Math.round(sc.resting_heart_rate);
  }

  // Strain del ciclo fisiológico (el "día" de WHOOP, que arranca al despertar).
  for (const c of cycles) {
    const sc = c.score ?? {};
    if (sc.strain == null) continue;
    row(chicagoDate(c.start)).strain = Number(sc.strain.toFixed(2));
  }

  const rows = [...byDate.values()];
  if (rows.length) {
    const { error } = await admin.from("recovery_daily").upsert(rows, { onConflict: "user_id,date" });
    if (error) return json({ error: "upsert failed", detail: error.message }, 500);
  }

  const conDatos = rows.filter(r => r.recovery_pct != null);
  return json({
    days: rows.length,
    with_recovery: conDatos.length,
    latest: rows.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
  });
});

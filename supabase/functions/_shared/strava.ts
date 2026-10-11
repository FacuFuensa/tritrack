// Lo que comparten strava-sync y strava-webhook: un access token vigente
// (refrescándolo si hace falta) y aplicar el matching contra plan_sessions.
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { brokenScope } from "./connection.ts";
import { matchActivity, type MatchableSession } from "./matching.ts";

export type TokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "not_connected" | "reauth" | "config" | "refresh_failed" };

// Refresh muerto (400/401) → la conexión queda marcada como rota en `scope`,
// sin borrar el token: el próximo OAuth lo pisa.
export async function stravaAccessToken(admin: SupabaseClient, userId: string): Promise<TokenResult> {
  const { data: tokens } = await admin.from("strava_tokens").select("*").eq("user_id", userId).maybeSingle();
  if (!tokens) return { ok: false, reason: "not_connected" };
  if (tokens.expires_at > Math.floor(Date.now() / 1000) + 60) {
    return { ok: true, accessToken: tokens.access_token };
  }

  const { data: cfg } = await admin.from("strava_config").select("*").single();
  if (!cfg) return { ok: false, reason: "config" };
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: cfg.client_id, client_secret: cfg.client_secret,
      grant_type: "refresh_token", refresh_token: tokens.refresh_token,
    }),
  });
  if (r.status === 400 || r.status === 401) {
    await markBroken(admin, userId);
    return { ok: false, reason: "reauth" };
  }
  if (!r.ok) return { ok: false, reason: "refresh_failed" };
  const nt = await r.json();
  await admin.from("strava_tokens").update({
    access_token: nt.access_token, refresh_token: nt.refresh_token,
    expires_at: nt.expires_at, updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  return { ok: true, accessToken: nt.access_token };
}

export async function markBroken(admin: SupabaseClient, userId: string) {
  const { data } = await admin.from("strava_tokens").select("scope").eq("user_id", userId).maybeSingle();
  await admin.from("strava_tokens").update({ scope: brokenScope(data?.scope) }).eq("user_id", userId);
}

export type ActivityForMatch = {
  external_id: string;
  date: string; // fecha local
  discipline: string;
  moving_s: number | null;
  started_at?: string | null;
};

export type SessionRow = MatchableSession & { date: string; title: string | null };

// Para cada actividad, busca la sesión de su fecha local y la marca 'done'
// con su activity_id. Devuelve qué sesión quedó para cada actividad.
export async function applyMatches(
  admin: SupabaseClient, userId: string, activities: ActivityForMatch[],
): Promise<Map<string, SessionRow>> {
  const result = new Map<string, SessionRow>();
  if (!activities.length) return result;

  const dates = [...new Set(activities.map((a) => a.date))];
  const { data: rows, error } = await admin.from("plan_sessions")
    .select("id, date, discipline, status, activity_id, prescription, title, order_index")
    .eq("user_id", userId)
    .in("date", dates)
    .order("order_index");
  if (error) throw new Error(`plan_sessions: ${error.message}`);

  const byDate = new Map<string, SessionRow[]>();
  for (const r of (rows ?? []) as SessionRow[]) {
    const list = byDate.get(r.date) ?? [];
    list.push(r);
    byDate.set(r.date, list);
  }

  // En orden de largada: si hay un brick, la bici llega primero.
  const ordered = [...activities].sort((a, b) => (a.started_at ?? "").localeCompare(b.started_at ?? ""));
  for (const a of ordered) {
    const session = matchActivity(a, byDate.get(a.date) ?? []);
    if (!session) continue;
    result.set(a.external_id, session);
    if (session.activity_id === a.external_id && session.status === "done") continue;

    const { error: upErr } = await admin.from("plan_sessions")
      .update({ status: "done", activity_id: a.external_id, updated_at: new Date().toISOString() })
      .eq("id", session.id)
      .neq("status", "skipped");
    if (upErr) throw new Error(`plan_sessions update: ${upErr.message}`);
    session.activity_id = a.external_id;
    session.status = "done";
  }
  return result;
}

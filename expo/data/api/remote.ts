// Origen real: Supabase con el JWT del usuario. RLS deja ver solo lo propio y
// escribir solo las columnas que le tocan a la app (spec §4).
import { supabase } from '../supabase';
import type { ActivityRow, BlockRow, RecoveryRow, WeekRow } from '../calc/rows';
import type {
  Checkin, Molestia, Nutricion, PlanSession, Prescription, Race, RaceClimate, RaceLogistics,
  RaceProfile, RaceResult,
} from '../types';
import type { Database } from '../database.types';
import type { DataApi } from './types';

type Tables = Database['public']['Tables'];

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// Para listas: sin error, Supabase siempre devuelve un arreglo.
function list<T>(res: { data: T[] | null; error: { message: string } | null }): T[] {
  return check(res) ?? [];
}

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Sin sesión');
  return id;
}

const SESSION_COLS = 'id, week_id, date, slot, order_index, optional, title, discipline, prescription, status, activity_id';

function toSession(r: Pick<Tables['plan_sessions']['Row'], 'id' | 'week_id' | 'date' | 'slot' | 'order_index'
  | 'optional' | 'title' | 'discipline' | 'prescription' | 'status' | 'activity_id'>): PlanSession {
  return {
    ...r,
    slot: r.slot as PlanSession['slot'],
    discipline: r.discipline as PlanSession['discipline'],
    prescription: (r.prescription ?? {}) as Prescription,
    status: r.status as PlanSession['status'],
  };
}

async function toRace(r: Tables['races']['Row']): Promise<Race> {
  // '{}' = todavía sin clima cargado.
  const climate = r.climate as unknown as Partial<RaceClimate> | null;
  let medal_url: string | null = null;
  if (r.medal_path) {
    const { data } = await supabase.storage.from('medallas').createSignedUrl(r.medal_path, 60 * 60 * 24 * 7);
    medal_url = data?.signedUrl ?? null;
  }
  return {
    id: r.id, name: r.name, date: r.date, location: r.location,
    kind: r.kind as Race['kind'],
    priority: r.priority as Race['priority'],
    status: r.status as Race['status'],
    start_local: r.start_local,
    logistics: (r.logistics ?? {}) as RaceLogistics,
    profile: (r.profile ?? {}) as RaceProfile,
    climate: climate?.by_segment ? (climate as RaceClimate) : null,
    strategy_md: r.strategy_md,
    result: r.result as unknown as RaceResult | null,
    medal_path: r.medal_path,
    medal_url,
    activity_ids: r.activity_ids,
  };
}

export const remoteApi: DataApi = {
  async block() {
    const row = check(await supabase.from('plan_blocks')
      .select('id, name, start_monday').eq('active', true).maybeSingle());
    return row as BlockRow | null;
  },

  async weeks() {
    const rows = list(await supabase.from('plan_weeks')
      .select('id, block_id, monday, week_index, kind, focus, status, briefing_md, feedback')
      .order('monday'));
    return rows as WeekRow[];
  },

  async sessions({ from, to }) {
    const rows = list(await supabase.from('plan_sessions').select(SESSION_COLS)
      .gte('date', from).lte('date', to).order('date').order('order_index'));
    return rows.map(toSession);
  },

  async session(id) {
    const row = check(await supabase.from('plan_sessions').select(SESSION_COLS).eq('id', id).maybeSingle());
    return row ? toSession(row) : null;
  },

  async activities({ from, to }) {
    const rows = list(await supabase.from('activities')
      .select('external_id, date, started_at, discipline, distance_m, moving_s, avg_hr, max_hr')
      .eq('source', 'strava').gte('date', from).lte('date', to));
    return rows as ActivityRow[];
  },

  async checkins({ from, to }) {
    const rows = list(await supabase.from('checkins')
      .select('id, date, session_id, activity_id, rpe, energia, molestia, nutricion, nota, created_at')
      .gte('date', from).lte('date', to));
    return rows.map((r) => ({
      ...r,
      molestia: r.molestia as unknown as Molestia | null,
      nutricion: r.nutricion as unknown as Nutricion | null,
    })) as Checkin[];
  },

  async recovery({ from, to }) {
    const rows = list(await supabase.from('recovery_daily')
      .select('date, recovery_pct, hrv_ms, rhr_bpm, sleep_h, sleep_perf_pct, strain')
      .gte('date', from).lte('date', to));
    return rows as RecoveryRow[];
  },

  async races() {
    const rows = list(await supabase.from('races').select('*').order('date'));
    return Promise.all(rows.map(toRace));
  },

  async setWeekStatus(weekId, status, feedback) {
    const patch: Tables['plan_weeks']['Update'] = { status };
    if (feedback !== undefined) patch.feedback = feedback;
    check(await supabase.from('plan_weeks').update(patch).eq('id', weekId));
  },

  async moveSession(id, date) {
    check(await supabase.from('plan_sessions').update({ date }).eq('id', id));
  },

  async insertCheckin(input) {
    check(await supabase.from('checkins').insert({
      user_id: await userId(),
      date: input.date,
      session_id: input.session_id ?? null,
      activity_id: input.activity_id ?? null,
      rpe: input.rpe,
      energia: input.energia,
      molestia: (input.molestia ?? null) as never,
      nutricion: (input.nutricion ?? null) as never,
      nota: input.nota ?? null,
    }));
  },

  async updateRace(id, patch) {
    check(await supabase.from('races').update(patch as Tables['races']['Update']).eq('id', id));
  },

  async uploadMedal(raceId, localUri) {
    const path = `${await userId()}/${raceId}.png`;
    const body = await (await fetch(localUri)).arrayBuffer();
    check(await supabase.storage.from('medallas').upload(path, body, { contentType: 'image/png', upsert: true }));
    return path;
  },
};

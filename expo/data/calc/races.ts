// Carreras: próximas y pasadas, cuenta regresiva, récords y tramos.
import type { PersonalRecord, Race, RaceResult, RaceSummary } from '../types';
import { daysBetween } from './dates.ts';

/** Días hasta la carrera (0 = es hoy). */
export function daysTo(raceDate: string, today: string): number {
  return daysBetween(today, raceDate);
}

/** Próximas (de hoy en adelante, la más cercana primero) y pasadas (la última primero). */
export function splitRaces(races: Race[], today: string): { upcoming: Race[]; past: Race[] } {
  const upcoming = races.filter((r) => r.date >= today && r.status !== 'done')
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = races.filter((r) => r.date < today || r.status === 'done')
    .sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}

export function toSummary(r: Race): RaceSummary {
  return { id: r.id, name: r.name, date: r.date, location: r.location, kind: r.kind, priority: r.priority, status: r.status };
}

export function nextRace(races: Race[], today: string): (RaceSummary & { days_to: number }) | null {
  const r = splitRaces(races, today).upcoming.find((x) => x.status !== 'dns');
  return r ? { ...toSummary(r), days_to: daysTo(r.date, today) } : null;
}

export type Segment = 'swim' | 'bike' | 'run';
export type SegmentState = 'ok' | 'suspendido' | 'sin_dato';

const SPLIT_KEY: Record<Segment, 'swim_s' | 'bike_s' | 'run_s'> = { swim: 'swim_s', bike: 'bike_s', run: 'run_s' };

/** Cómo mostrar un tramo: con tiempo, "suspendido" o "sin dato". Nunca 0:00. */
export function segmentState(result: RaceResult | null, seg: Segment): SegmentState {
  if (result?.cancelled?.includes(seg)) return 'suspendido';
  const v = result?.splits[SPLIT_KEY[seg]];
  return v != null && v > 0 ? 'ok' : 'sin_dato';
}

/** Tiempo de un tramo o null si no hay (suspendido o sin dato). */
export function segmentSeconds(result: RaceResult | null, seg: Segment): number | null {
  return segmentState(result, seg) === 'ok' ? result!.splits[SPLIT_KEY[seg]]! : null;
}

/**
 * Récord por tipo de carrera. Solo cuentan carreras terminadas con tiempo
 * total y sin tramos suspendidos: un triatlón sin nado no es comparable, y
 * un total null no es un 0.
 */
export function personalRecords(races: Race[]): PersonalRecord[] {
  const best = new Map<Race['kind'], PersonalRecord>();
  for (const r of races) {
    const t = r.result?.total_s;
    if (r.status !== 'done' || t == null || t <= 0) continue;
    if (r.result?.cancelled?.length) continue;
    const cur = best.get(r.kind);
    if (!cur || t < cur.best_s) best.set(r.kind, { kind: r.kind, best_s: t, race_id: r.id });
  }
  return [...best.values()];
}

/** Medallas: carreras terminadas, la más reciente primero. */
export function medals(races: Race[]): Race[] {
  return races.filter((r) => r.status === 'done').sort((a, b) => b.date.localeCompare(a.date));
}

/** "1:02:03" o "45:07". null → null: la pantalla muestra "sin dato". */
export function formatDuration(s: number | null | undefined): string | null {
  if (s == null || !Number.isFinite(s) || s <= 0) return null;
  const total = Math.round(s);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), sec = total % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

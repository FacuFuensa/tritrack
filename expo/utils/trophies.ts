import type { RaceResult } from '../data/types';
import { segmentSeconds, segmentState } from '../data/calc/races.ts';

export const splitKeys = ['swim', 't1', 'bike', 't2', 'run'] as const;
export type SplitKey = typeof splitKeys[number];
export const splitNames: Record<SplitKey, string> = { swim: 'Nado', t1: 'T1', bike: 'Bici', t2: 'T2', run: 'Trote' };
export const suspendedNames = { swim: 'Nado suspendido', bike: 'Bici suspendida', run: 'Trote suspendido' };
export type RankKey = 'rank_overall' | 'field_overall' | 'rank_division' | 'field_division';
export interface ManualFields {
  total: string[];
  splits: Partial<Record<SplitKey, string>>;
  cancelled: string[];
  ranks: Partial<Record<RankKey, string>>;
  division: string;
}

export function parseTime(parts: string[]): number | null | 'invalid' {
  if (parts.every(p => !p.trim())) return null;
  if (parts.length !== 3 || parts.some(p => p !== '' && !/^\d+$/.test(p))) return 'invalid';
  const [h, m, s] = parts.map(p => Number(p || 0));
  const total = h * 3600 + m * 60 + s;
  return m > 59 || s > 59 || total <= 0 || !Number.isSafeInteger(total) ? 'invalid' : total;
}

export function buildManualResult(fields: ManualFields): RaceResult | null {
  const total = parseTime(fields.total);
  if (total === 'invalid') return null;
  const result: RaceResult = { total_s: total, splits: {}, source: 'manual' };
  for (const key of splitKeys) {
    if (fields.cancelled.includes(key)) continue;
    const raw = fields.splits[key]?.trim();
    if (!raw) continue;
    const seconds = parseTime(raw.split(':'));
    if (seconds === 'invalid' || seconds === null) return null;
    result.splits[`${key}_s`] = seconds;
  }
  const cancelled = fields.cancelled.filter((k): k is 'swim' | 'bike' | 'run' => k === 'swim' || k === 'bike' || k === 'run');
  if (cancelled.length) result.cancelled = cancelled;
  for (const key of Object.keys(fields.ranks) as RankKey[]) {
    const raw = fields.ranks[key]?.trim();
    if (!raw) continue;
    const n = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n <= 0) return null;
    result[key] = n;
  }
  if (fields.division.trim()) result.division = fields.division.trim();
  return result;
}

export function splitLayout(result: RaceResult) {
  const parts = splitKeys.map(key => {
    const discipline = key === 'swim' || key === 'bike' || key === 'run';
    const seconds = discipline ? segmentSeconds(result, key) : (result.splits[`${key}_s`] ?? null);
    const state = discipline ? segmentState(result, key) : seconds != null && seconds > 0 ? 'ok' : 'sin_dato';
    return { key, state, seconds: state === 'ok' ? seconds : null };
  });
  const available = 100 - parts.filter(p => p.state === 'suspendido').length * 12;
  const sum = parts.reduce((n, p) => n + (p.seconds ?? 0), 0);
  return parts.map(p => ({ ...p, width: p.state === 'suspendido' ? 12 : sum ? (p.seconds ?? 0) / sum * available : 0 }));
}

// Nombres de los links a Strava: en un triatlón, las actividades se guardan en
// el orden de la carrera, una por tramo con tiempo (Waco: bici, T2, trote). Si
// la cuenta no cierra, no adivinamos.
export function activityLabels(result: RaceResult | null, triathlon: boolean, count: number): string[] {
  if (count === 1) return ['Ver en Strava'];
  const legs = triathlon && result ? splitLayout(result).filter(p => p.state === 'ok').map(p => splitNames[p.key]) : [];
  return legs.length === count ? legs : Array.from({ length: count }, (_, i) => `Actividad ${i + 1}`);
}

export function editionDifference(current: RaceResult | null, other: RaceResult | null): number | null {
  if (current?.total_s == null || other?.total_s == null || current.cancelled?.length || other.cancelled?.length) return null;
  return other.total_s - current.total_s;
}

// Inclinación de la medalla: relativa a cómo se sostiene el teléfono (la primera
// lectura es el cero), amplificada y con tope. La base sigue despacio a la
// postura, así que si cambiás cómo lo tenés, la medalla vuelve a centrarse.
export const TILT_MAX = 30;
export const TILT_GAIN = 2.5;
const TILT_RECENTER = 0.02;
export type TiltBase = { beta: number; gamma: number };
const clampTilt = (n: number) => Math.max(-TILT_MAX, Math.min(TILT_MAX, n));
export function tiltStep(base: TiltBase | null, beta: number, gamma: number): { base: TiltBase; x: number; y: number } {
  if (!base) return { base: { beta, gamma }, x: 0, y: 0 };
  return {
    base: { beta: base.beta + (beta - base.beta) * TILT_RECENTER, gamma: base.gamma + (gamma - base.gamma) * TILT_RECENTER },
    x: clampTilt((beta - base.beta) * TILT_GAIN),
    y: clampTilt((gamma - base.gamma) * TILT_GAIN),
  };
}

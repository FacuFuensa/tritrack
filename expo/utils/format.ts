import type { Discipline, RaceKind } from '../data/types';
import { formatDuration } from '../data/calc/races.ts';
import { addDays } from '../data/calc/dates.ts';

function calendarDate(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12));
}
const part = (d: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-AR', { ...options, timeZone: 'UTC' }).format(calendarDate(d)).replaceAll('.', '').replace('sept', 'sep');
export const fmtDate = (d: string): string => `${part(d, { weekday: 'short' })} ${Number(d.slice(8))} ${part(d, { month: 'short' })}`;
export const fmtDateLong = (d: string): string => `${part(d, { weekday: 'long' })} ${Number(d.slice(8))} de ${part(d, { month: 'long' })}`;
export const fmtDuration = (s: number | null): string => formatDuration(s) ?? 'sin dato';
export function fmtMinutes(min: number): string {
  const n = Math.round(min);
  return n < 60 ? `${n} min` : `${Math.floor(n / 60)} h${n % 60 ? ` ${n % 60}` : ''}`;
}
export const fmtDistance = (m: number | null, d: Discipline | null): string => m == null ? 'sin dato' : d === 'swim' ? `${Math.round(m)} m` : `${Number((m / 1000).toFixed(1)).toString().replace('.', ',')} km`;
function pace(s: number): string { const n = Math.round(s); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; }
export const fmtPace = (s: number | null): string => s == null ? 'sin dato' : `${pace(s)} /km`;
export const fmtSwimPace = (s: number | null, m: number | null): string => s == null || m == null || m <= 0 ? 'sin dato' : `${pace(s / m * 100)} /100 m`;
export const fmtStartTime = (t: string | null): string => t == null ? 'sin dato' : `${Number(t.split(':')[0])}:${t.split(':')[1]}`;
export const disciplineName = (d: Discipline | null): string => d == null ? 'Entrenamiento' : ({ swim: 'Nado', bike: 'Bici', run: 'Trote', brick: 'Combinado', gym: 'Gimnasio', rest: 'Descanso' }[d]);
export const raceKindName = (k: RaceKind): string => ({ run_5k: '5K', run_10k: '10K', run_21k: 'Media maratón', run_42k: 'Maratón', tri_sprint: 'Triatlón sprint', tri_olympic: 'Triatlón olímpico', tri_703: 'Medio Ironman', tri_full: 'Ironman', other: 'Carrera' }[k]);
export const daysToText = (n: number): string => n === 0 ? 'Es hoy' : n === 1 ? 'Mañana' : `Faltan ${n} días`;
export function fmtWeekRange(monday: string): string {
  const end = addDays(monday, 6);
  return `${Number(monday.slice(8))}${monday.slice(0, 7) !== end.slice(0, 7) ? ` ${part(monday, { month: 'short' })}` : ''} – ${Number(end.slice(8))} ${part(end, { month: 'short' })}`;
}
export const firstLine = (md: string | null): string => md?.split('\n').find(l => l.trim())?.replace(/[#*]/g, '').trim() ?? '';

// Semana: qué semana corresponde a una fecha, totales, volumen y % en Z2.
import type { Discipline, SessionView, VolumeRow, VolumeUnit, WeekSummary } from '../types';
import { mondayOf } from './dates.ts';
import type { WeekRow } from './rows.ts';

export function summarizeWeek(
  row: WeekRow,
  sessions: Pick<SessionView, 'week_id' | 'discipline' | 'status' | 'prescription'>[],
  blockName: string | null,
): WeekSummary {
  const own = sessions.filter((s) => s.week_id === row.id && s.discipline !== 'rest');
  return {
    id: row.id,
    monday: row.monday,
    week_index: row.week_index,
    kind: row.kind,
    focus: row.focus,
    status: row.status,
    briefing_md: row.briefing_md,
    feedback: row.feedback,
    block_name: blockName,
    sessions_planned: own.length,
    sessions_done: own.filter((s) => s.status === 'done').length,
    minutes_planned: own.reduce((t, s) => t + (s.prescription.dur_min ?? 0), 0),
  };
}

export interface TodayWeekState {
  /** La semana que contiene `date`, si existe. */
  current: WeekRow | null;
  /** Semana propuesta sin aceptar (la actual o la próxima), para el banner. */
  proposed: WeekRow | null;
  /** No hay semana para la fecha: la rutina del domingo no corrió. */
  missingWeek: boolean;
}

/**
 * Estado de Hoy (Foco de revisión 2). Una semana `proposed` cuenta como
 * semana: se ve y se entrena aunque no se haya aceptado.
 */
export function todayWeekState(weeks: WeekRow[], date: string): TodayWeekState {
  const monday = mondayOf(date);
  const current = weeks.find((w) => w.monday === monday) ?? null;
  const proposed = weeks
    .filter((w) => w.status === 'proposed' && w.monday >= monday)
    .sort((a, b) => a.monday.localeCompare(b.monday))[0] ?? null;
  return { current, proposed, missingWeek: current == null };
}

const UNIT: Partial<Record<Discipline, VolumeUnit>> = { swim: 'm', bike: 'km', run: 'km', brick: 'ses', gym: 'ses' };
const ORDER: Discipline[] = ['swim', 'bike', 'run', 'brick', 'gym'];

/**
 * Plan vs hecho por disciplina. Nado en metros, bici y trote en km, brick y
 * gimnasio en sesiones. Lo hecho sale de la actividad real; si una sesión
 * hecha no tiene distancia, no suma (no se inventa).
 */
export function volumeByDiscipline(sessions: SessionView[]): VolumeRow[] {
  const rows = new Map<Discipline, VolumeRow>();
  for (const s of sessions) {
    const d = s.discipline;
    if (!d || !UNIT[d]) continue;
    const unit = UNIT[d]!;
    const row = rows.get(d) ?? { discipline: d, planned: 0, done: 0, unit };
    if (unit === 'ses') {
      row.planned += 1;
      if (s.status === 'done') row.done += 1;
    } else {
      const k = unit === 'km' ? 1000 : 1;
      row.planned += (s.prescription.distance_m ?? 0) / k;
      if (s.status === 'done' && s.actual?.distance_m != null) row.done += s.actual.distance_m / k;
    }
    rows.set(d, row);
  }
  return ORDER.filter((d) => rows.has(d)).map((d) => {
    const r = rows.get(d)!;
    const round = (n: number) => (r.unit === 'km' ? Math.round(n * 10) / 10 : Math.round(n));
    return { ...r, planned: round(r.planned), done: round(r.done) };
  });
}

/**
 * % del tiempo hecho bajo el techo de pulso (el techo de las sesiones suaves
 * es Z2). Promedio de pct_under_cap pesado por minutos, entre las sesiones
 * hechas con techo y dato. null si no hay ninguna medible.
 */
export function z2Pct(sessions: SessionView[]): number | null {
  let weighted = 0, total = 0;
  for (const s of sessions) {
    const a = s.actual;
    if (s.status !== 'done' || !a || a.pct_under_cap == null || !a.moving_s) continue;
    weighted += a.pct_under_cap * a.moving_s;
    total += a.moving_s;
  }
  return total ? Math.round(weighted / total) : null;
}

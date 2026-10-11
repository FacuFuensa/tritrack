// Arma lo que devuelven useToday, useWeek, useRaces y useTrophies a partir de
// las filas crudas. Puro: los hooks solo traen filas y llaman a esto, así la
// misma lógica corre con la base y con los mocks, y se testea sin red.
import type {
  Checkin, PlanSession, Race, RacesData, TodayData, TrophiesData, WeekData,
} from '../types';
import { mondayOf } from './dates.ts';
import { medals, nextRace, personalRecords, splitRaces } from './races.ts';
import { latestRecovery } from './recovery.ts';
import type { ActivityRow, BlockRow, RecoveryRow, WeekRow } from './rows.ts';
import { buildSessionViews } from './session.ts';
import { summarizeWeek, todayWeekState, volumeByDiscipline, z2Pct } from './week.ts';

export interface PlanRows {
  block: BlockRow | null;
  weeks: WeekRow[];
  sessions: PlanSession[];
  activities: ActivityRow[];
  checkins: Checkin[];
}

export function composeToday(
  date: string,
  rows: PlanRows & { recovery: RecoveryRow[]; races: Race[] },
): TodayData {
  const state = todayWeekState(rows.weeks, date);
  const views = buildSessionViews(rows.sessions.filter((s) => s.date === date), rows.activities, rows.checkins);
  const blockName = rows.block?.name ?? null;
  return {
    date,
    block: state.current && rows.block
      ? { name: rows.block.name, week_index: state.current.week_index }
      : null,
    nextRace: nextRace(rows.races, date),
    recovery: latestRecovery(rows.recovery, date),
    sessions: views,
    proposedWeek: state.proposed ? summarizeWeek(state.proposed, rows.sessions, blockName) : null,
    missingWeek: state.missingWeek,
  };
}

export function composeWeek(monday: string, rows: PlanRows): WeekData {
  const m = mondayOf(monday);
  const row = rows.weeks.find((w) => w.monday === m) ?? null;
  const sessions = buildSessionViews(
    rows.sessions.filter((s) => (row ? s.week_id === row.id : mondayOf(s.date) === m)),
    rows.activities, rows.checkins,
  );
  return {
    week: row ? summarizeWeek(row, rows.sessions, rows.block?.name ?? null) : null,
    sessions,
    volume: volumeByDiscipline(sessions),
    z2Pct: z2Pct(sessions),
  };
}

/** Semanas anteriores a `today`, la más reciente primero. */
export function composeHistory(today: string, rows: Pick<PlanRows, 'weeks' | 'sessions' | 'block'>) {
  const current = mondayOf(today);
  return rows.weeks
    .filter((w) => w.monday < current)
    .sort((a, b) => b.monday.localeCompare(a.monday))
    .map((w) => summarizeWeek(w, rows.sessions, rows.block?.name ?? null));
}

export function composeRaces(races: Race[], today: string): RacesData {
  return splitRaces(races, today);
}

export function composeTrophies(races: Race[]): TrophiesData {
  return { prs: personalRecords(races), medals: medals(races) };
}

// Lo que la capa de datos necesita de un origen (Supabase o los mocks): filas
// crudas y escrituras. Los hooks arman las formas de C5 con data/calc/.
import type { ActivityRow, BlockRow, RecoveryRow, WeekRow } from '../calc/rows';
import type { Checkin, CheckinInput, PlanSession, Race, RaceResult, RaceStatus, WeekStatus } from '../types';

export interface DateRange { from: string; to: string } // inclusive, AAAA-MM-DD

export interface DataApi {
  block(): Promise<BlockRow | null>;
  weeks(): Promise<WeekRow[]>;
  sessions(range: DateRange): Promise<PlanSession[]>;
  session(id: string): Promise<PlanSession | null>;
  activities(range: DateRange): Promise<ActivityRow[]>;
  checkins(range: DateRange): Promise<Checkin[]>;
  recovery(range: DateRange): Promise<RecoveryRow[]>;
  races(): Promise<Race[]>;

  setWeekStatus(weekId: string, status: WeekStatus, feedback?: string): Promise<void>;
  insertCheckin(input: CheckinInput): Promise<void>;
  updateRace(id: string, patch: { status?: RaceStatus; result?: RaceResult; medal_path?: string }): Promise<void>;
  /** Sube la foto a medallas/<user_id>/<race_id>.png y devuelve la ruta. */
  uploadMedal(raceId: string, localUri: string): Promise<string>;
}

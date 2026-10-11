// Filas crudas que llegan de la base (o de los mocks) antes de armar las
// formas de los hooks. Solo las columnas que la app usa.
import type { WeekKind, WeekStatus } from '../types';

export interface WeekRow {
  id: string;
  block_id: string;
  monday: string;
  week_index: number;
  kind: WeekKind;
  focus: string | null;
  status: WeekStatus;
  briefing_md: string | null;
  feedback: string | null;
}

export interface BlockRow { id: string; name: string; start_monday: string }

export interface ActivityRow {
  external_id: string;
  date: string;
  started_at: string | null;
  discipline: string | null;   // swim | bike | run | gym | other
  distance_m: number | null;
  moving_s: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  /** Muestras de FC (1 por segundo), si algún día se guardan. Hoy no vienen. */
  hr_samples?: number[];
}

export interface RecoveryRow {
  date: string;
  recovery_pct: number | null;
  hrv_ms: number | null;
  rhr_bpm: number | null;
  sleep_h: number | null;
  sleep_perf_pct: number | null;
  strain: number | null;
}

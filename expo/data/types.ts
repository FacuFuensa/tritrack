// Formas de datos de TriTrack. C4 (jsonb) va tal cual el plan; el resto son
// las formas que devuelven los hooks (C5). Se definen una sola vez acá y las
// pantallas las importan de este archivo.

// ---------------------------------------------------------------------------
// C4 · JSON de los campos jsonb
// ---------------------------------------------------------------------------

export type Discipline = 'swim' | 'bike' | 'run' | 'brick' | 'gym' | 'rest';
export type SessionTag = 'pierna_pesada' | 'calidad_carrera' | 'fondo' | 'especifico' | 'simulacro';

export interface Step { label: string; dur_min?: number; distance_m?: number; reps?: number;
  target?: string; hr_cap?: number; note?: string }
export interface Exercise { name: string; sets: number; reps: string; cue?: string }
export interface Prescription { dur_min?: number; distance_m?: number; hr_cap?: number;
  pace?: string; steps?: Step[]; exercises?: Exercise[]; why?: string; tags?: SessionTag[] }

export type Source = 'medido' | 'oficial' | 'estimado';
export interface Field<T> { value: T | null; source: Source; note?: string }
export interface RaceProfile {
  swim?: { distance_m?: Field<number>; water_type?: Field<'mar'|'lago'|'rio'|'pileta'>;
           salt?: Field<boolean>; temp_c?: Field<number>; wetsuit?: Field<string>;
           start_type?: Field<string>; course_shape?: Field<string> };
  bike?: { distance_km?: Field<number>; elev_gain_m?: Field<number>; key_climbs?: Field<string[]>;
           aid_stations?: Field<string>; roads?: Field<string>; profile_points?: Field<[number, number][]> };
  run?:  { distance_km?: Field<number>; elev_gain_m?: Field<number>; loops?: Field<number>;
           surface?: Field<string>; profile_points?: Field<[number, number][]> };
}
export interface ClimateRow { segment: 'swim'|'bike'|'run'|'race'; hour_local: number;
  temp_c_median: number; temp_c_min: number; temp_c_max: number; dewpoint_c_median: number;
  feels_max_c: number; rain_years: number; years: number }
export interface RaceClimate { by_segment: ClimateRow[]; forecast?: { fetched_at: string;
  temp_c: number; feels_c: number; wind_kmh: number; rain_pct: number }; updated_at: string }
export interface RaceResult { total_s: number | null;
  splits: { swim_s?: number; t1_s?: number; bike_s?: number; t2_s?: number; run_s?: number };
  cancelled?: ('swim'|'bike'|'run')[]; division?: string; rank_division?: number;
  field_division?: number; rank_overall?: number; field_overall?: number;
  hr_by_segment?: { swim?: number; bike?: number; run?: number }; source: string }

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export type WeekStatus = 'proposed' | 'accepted' | 'changes_requested';
export type WeekKind = 'reset' | 'build' | 'peak' | 'absorb' | 'taper' | 'race';
export type SessionStatus = 'planned' | 'done' | 'skipped';

/** Una semana del plan, con totales ya calculados. */
export interface WeekSummary {
  id: string;
  monday: string;            // AAAA-MM-DD
  week_index: number;        // 1 = primera semana del bloque
  kind: WeekKind;
  focus: string | null;
  status: WeekStatus;
  briefing_md: string | null;
  feedback: string | null;
  block_name: string | null;
  sessions_planned: number;  // sin contar descansos
  sessions_done: number;
  minutes_planned: number;   // suma de prescription.dur_min
}

/** Fila de plan_sessions tal como la usa la app. */
export interface PlanSession {
  id: string;
  week_id: string;
  date: string;              // fecha local AAAA-MM-DD
  slot: 'AM' | 'PM';
  order_index: number;
  optional: boolean;
  title: string | null;
  discipline: Discipline | null;
  prescription: Prescription;
  status: SessionStatus;
  activity_id: string | null;
}

/** Lo que pasó de verdad, de la actividad de Strava que cumplió la sesión. */
export interface ActualData {
  distance_m: number | null;
  moving_s: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  avg_pace_s_per_km: number | null;
  /** % del tiempo bajo prescription.hr_cap. null = no se puede saber ("sin dato"). */
  pct_under_cap: number | null;
}

export interface Molestia { zona: string; nivel: 0 | 1 | 2 | 3 }  // nada/tirante/dolor/calambre
export interface Nutricion { geles?: number; liquido_ml?: number }

export interface Checkin {
  id: string;
  date: string;
  session_id: string | null;
  activity_id: string | null;
  rpe: number | null;        // 1-10
  energia: number | null;    // 1-5
  molestia: Molestia | null;
  nutricion: Nutricion | null;
  nota: string | null;
  /** Lo que dijo en el audio, pasado a texto en el iPhone. */
  transcripcion: string | null;
  /** checkins-audio/<user_id>/… ; varias sesiones pueden compartir el mismo audio. */
  audio_path: string | null;
  audio_s: number | null;
  created_at: string;
}

export interface SessionView extends PlanSession {
  actual?: ActualData;
  checkin?: Checkin;
}

/** Lo que manda la hoja de check-in. session_id o activity_id, uno de los dos. */
export interface CheckinInput {
  date: string;
  session_id?: string;
  activity_id?: string;
  rpe?: number;
  energia?: number;
  molestia?: Molestia;
  nutricion?: Nutricion;
  nota?: string;
  transcripcion?: string;
  audio_path?: string;
  audio_s?: number;
}

/** Check-in por audio: un solo audio para una o varias sesiones del día. */
export interface VoiceCheckinInput {
  date: string;
  targets: ({ session_id: string } | { activity_id: string })[];
  transcripcion: string;
  /** Archivo local del audio; null si no se pudo guardar (web) o se escribió a mano. */
  audioUri: string | null;
  audio_s?: number;
}

// ---------------------------------------------------------------------------
// Recuperación (Whoop)
// ---------------------------------------------------------------------------

export type RecoveryLight = 'verde' | 'amarillo' | 'rojo';

export interface Recovery {
  date: string;              // día del dato (puede ser anterior a hoy)
  recovery_pct: number | null;
  hrv_ms: number | null;
  rhr_bpm: number | null;
  sleep_h: number | null;
  sleep_perf_pct: number | null;
  strain: number | null;
  /** Semáforo de Whoop: ≥67 verde, 34-66 amarillo, ≤33 rojo. null sin dato. */
  light: RecoveryLight | null;
}

// ---------------------------------------------------------------------------
// Carreras
// ---------------------------------------------------------------------------

export type RaceKind = 'run_5k' | 'run_10k' | 'run_21k' | 'run_42k'
  | 'tri_sprint' | 'tri_olympic' | 'tri_703' | 'tri_full' | 'other';
export type RaceStatus = 'planned' | 'registered' | 'done' | 'dns';
export type RacePriority = 'A' | 'B' | 'C';

export interface RaceLogistics {
  inscripcion_cierra?: string;  // AAAA-MM-DD
  retiro_kit?: string;
  viaje?: string;
  url?: string;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  location: string | null;
  kind: RaceKind;
  priority: RacePriority | null;
  status: RaceStatus;
  start_local: string | null;   // HH:MM:SS
  logistics: RaceLogistics;
  profile: RaceProfile;
  climate: RaceClimate | null;  // null si todavía no se cargó
  strategy_md: string | null;
  result: RaceResult | null;
  medal_path: string | null;
  /** URL firmada de la medalla, lista para <Image>. null sin medalla. */
  medal_url: string | null;
  activity_ids: string[];
}

/** Lo mínimo de una carrera para tarjetas y cuentas regresivas. */
export type RaceSummary = Pick<Race, 'id' | 'name' | 'date' | 'location' | 'kind' | 'priority' | 'status'>;

// ---------------------------------------------------------------------------
// Formas de los hooks (C5)
// ---------------------------------------------------------------------------

export interface TodayData {
  date: string;
  block: { name: string; week_index: number } | null;
  nextRace: (RaceSummary & { days_to: number }) | null;
  recovery: Recovery | null;
  sessions: SessionView[];
  proposedWeek: WeekSummary | null;
  missingWeek: boolean;
}

export type VolumeUnit = 'm' | 'km' | 'ses';
export interface VolumeRow { discipline: Discipline; planned: number; done: number; unit: VolumeUnit }

export interface WeekData {
  week: WeekSummary | null;
  sessions: SessionView[];
  volume: VolumeRow[];
  z2Pct: number | null;
}

export interface RacesData { upcoming: Race[]; past: Race[] }

export interface PersonalRecord { kind: RaceKind; best_s: number; race_id: string }
export interface TrophiesData { prs: PersonalRecord[]; medals: Race[] }

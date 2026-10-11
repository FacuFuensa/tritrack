// Mapeo puro de una actividad de Strava a una fila de `activities`. Sin red,
// para que `deno test` lo cubra.

export type StravaActivity = {
  id?: number | string;
  name?: string;
  sport_type?: string;
  type?: string;
  start_date?: string;
  start_date_local?: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  total_elevation_gain?: number;
};

const DISCIPLINE: Record<string, string> = {
  Ride: "bike", VirtualRide: "bike", GravelRide: "bike",
  Run: "run", TrailRun: "run",
  Swim: "swim",
  WeightTraining: "gym", Workout: "gym",
};

export function disciplineOf(a: Pick<StravaActivity, "sport_type" | "type">): string {
  return DISCIPLINE[a.sport_type ?? ""] ?? DISCIPLINE[a.type ?? ""] ?? "other";
}

// La fecha es la del reloj de quien entrenó: start_date_local trae la hora
// local con una "Z" de mentira, así que alcanza con sus primeros 10
// caracteres. Una carrera en otro estado cae en su día, no en el de UTC.
export function localDate(a: Pick<StravaActivity, "start_date" | "start_date_local">): string {
  if (a.start_date_local) return a.start_date_local.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(a.start_date!));
}

const int = (n: number | undefined) => (n == null ? null : Math.round(n));

export function toActivityRow(userId: string, a: StravaActivity) {
  return {
    user_id: userId,
    source: "strava",
    external_id: String(a.id),
    date: localDate(a),
    started_at: a.start_date ?? null,
    sport: a.sport_type ?? a.type ?? null,
    discipline: disciplineOf(a),
    distance_m: a.distance ?? null,
    moving_s: int(a.moving_time),
    elapsed_s: int(a.elapsed_time),
    avg_hr: int(a.average_heartrate),
    max_hr: int(a.max_heartrate),
    avg_watts: a.average_watts ?? null,
    elev_m: a.total_elevation_gain ?? null,
    raw: a,
  };
}

// Contrato C2: {days?} con default 14 y máximo 90.
export function clampDays(days: unknown): number {
  const n = typeof days === "number" && Number.isFinite(days) ? Math.round(days) : 14;
  return Math.min(90, Math.max(1, n));
}

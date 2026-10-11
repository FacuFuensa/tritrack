// Matching puro de una actividad de Strava con las sesiones del plan de su
// fecha local. Sin red, para que `deno test` lo cubra. Lo usan strava-sync y
// strava-webhook.

export type MatchableActivity = {
  external_id: string;
  discipline: string; // disciplineOf(): swim | bike | run | gym | other
  moving_s: number | null;
};

export type MatchableSession = {
  id: string;
  discipline: string | null;
  status: string; // planned | done | skipped
  activity_id: string | null;
  prescription: { dur_min?: number } | null;
};

// Un brick se cumple con la bici o con el trote.
function accepts(session: string | null, activity: string): boolean {
  if (!session) return false;
  if (session === activity) return true;
  return session === "brick" && (activity === "bike" || activity === "run");
}

// Elige, entre las sesiones de la fecha local de la actividad, la de la misma
// disciplina que todavía no tiene actividad, con la menor diferencia entre la
// duración real y la planeada. Una sesión marcada a mano como 'skipped' nunca
// se pisa. Si la actividad ya está asignada a una sesión, devuelve esa (así
// correr el sync dos veces no la asigna dos veces).
export function matchActivity<S extends MatchableSession>(
  activity: MatchableActivity,
  sessionsOfThatLocalDate: S[],
): S | null {
  const already = sessionsOfThatLocalDate.find((s) => s.activity_id === activity.external_id);
  if (already) return already;

  const realMin = activity.moving_s != null ? activity.moving_s / 60 : null;
  const gap = (s: S) => {
    const planned = s.prescription?.dur_min;
    return realMin == null || planned == null ? Number.POSITIVE_INFINITY : Math.abs(realMin - planned);
  };

  let best: S | null = null;
  for (const s of sessionsOfThatLocalDate) {
    if (s.activity_id || s.status === "skipped") continue;
    if (!accepts(s.discipline, activity.discipline)) continue;
    if (!best || gap(s) < gap(best)) best = s;
  }
  return best;
}

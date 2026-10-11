// Sesión del plan + lo que pasó de verdad (actividad de Strava y check-in).
import type { ActualData, Checkin, PlanSession, SessionView } from '../types';
import type { ActivityRow } from './rows.ts';

/**
 * % del tiempo con la FC bajo el techo. Con muestras, exacto. Sin muestras,
 * solo se puede afirmar 100 % si el máximo no pasó el techo; si lo pasó, no
 * se sabe cuánto: null ("sin dato"), nunca 0.
 */
export function pctUnderCap(
  cap: number | undefined,
  a: Pick<ActivityRow, 'max_hr' | 'hr_samples'>,
): number | null {
  if (cap == null) return null;
  if (a.hr_samples && a.hr_samples.length) {
    const under = a.hr_samples.filter((hr) => hr <= cap).length;
    return Math.round((under / a.hr_samples.length) * 100);
  }
  if (a.max_hr != null && a.max_hr <= cap) return 100;
  return null;
}

export function actualFromActivity(a: ActivityRow, hrCap?: number): ActualData {
  const pace = a.distance_m && a.moving_s ? a.moving_s / (a.distance_m / 1000) : null;
  return {
    distance_m: a.distance_m,
    moving_s: a.moving_s,
    avg_hr: a.avg_hr,
    max_hr: a.max_hr,
    avg_pace_s_per_km: pace == null ? null : Math.round(pace),
    pct_under_cap: pctUnderCap(hrCap, a),
  };
}

/** Une cada sesión con su actividad (por activity_id) y su último check-in. */
export function buildSessionViews(
  sessions: PlanSession[],
  activities: ActivityRow[],
  checkins: Checkin[],
): SessionView[] {
  const byActivity = new Map(activities.map((a) => [a.external_id, a]));
  const lastCheckin = new Map<string, Checkin>();
  for (const c of [...checkins].sort((x, y) => x.created_at.localeCompare(y.created_at))) {
    if (c.session_id) lastCheckin.set(c.session_id, c);
  }

  return [...sessions]
    .sort((x, y) => x.date.localeCompare(y.date)
      || (x.slot === y.slot ? 0 : x.slot === 'AM' ? -1 : 1)
      || x.order_index - y.order_index)
    .map((s) => {
      const view: SessionView = { ...s };
      const act = s.activity_id ? byActivity.get(s.activity_id) : undefined;
      if (act) view.actual = actualFromActivity(act, s.prescription.hr_cap);
      const c = lastCheckin.get(s.id);
      if (c) view.checkin = c;
      return view;
    });
}

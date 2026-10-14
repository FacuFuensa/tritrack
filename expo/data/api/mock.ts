// Origen de prueba: el escenario inventado de data/mocks/, en memoria. Las
// escrituras cambian el escenario mientras la app está abierta, así se pueden
// probar Aceptar, el check-in o "Ya me inscribí" sin backend.
import { todayLocal } from '../calc/dates';
import { buildScenario } from '../mocks/scenario';
import type { DataApi, DateRange } from './types';

const sc = buildScenario(todayLocal());
const inRange = (d: string, r: DateRange) => d >= r.from && d <= r.to;
const delay = <T>(v: T) => new Promise<T>((res) => setTimeout(() => res(JSON.parse(JSON.stringify(v)) as T), 150));

export const mockApi: DataApi = {
  block: () => delay(sc.block),
  weeks: () => delay(sc.weeks),
  sessions: (r) => delay(sc.sessions.filter((s) => inRange(s.date, r))),
  session: (id) => delay(sc.sessions.find((s) => s.id === id) ?? null),
  activities: (r) => delay(sc.activities.filter((a) => inRange(a.date, r))),
  checkins: (r) => delay(sc.checkins.filter((c) => inRange(c.date, r))),
  recovery: (r) => delay(sc.recovery.filter((x) => inRange(x.date, r))),
  races: () => delay(sc.races),

  async setWeekStatus(weekId, status, feedback) {
    const w = sc.weeks.find((x) => x.id === weekId);
    if (!w) throw new Error('Semana inexistente');
    w.status = status;
    if (feedback !== undefined) w.feedback = feedback;
    await delay(null);
  },

  async moveSession(id, date) {
    const s = sc.sessions.find((x) => x.id === id);
    if (!s) throw new Error('Sesión inexistente');
    s.date = date;
    await delay(null);
  },

  async insertCheckin(input) {
    sc.checkins.push({
      id: `chk-${sc.checkins.length + 1}`,
      date: input.date,
      session_id: input.session_id ?? null,
      activity_id: input.activity_id ?? null,
      rpe: input.rpe ?? null,
      energia: input.energia ?? null,
      molestia: input.molestia ?? null,
      nutricion: input.nutricion ?? null,
      nota: input.nota ?? null,
      transcripcion: input.transcripcion ?? null,
      audio_path: input.audio_path ?? null,
      audio_s: input.audio_s ?? null,
      created_at: new Date().toISOString(),
    });
    await delay(null);
  },

  async updateRace(id, patch) {
    const r = sc.races.find((x) => x.id === id);
    if (!r) throw new Error('Carrera inexistente');
    Object.assign(r, patch);
    await delay(null);
  },

  async uploadMedal(raceId, localUri) {
    const r = sc.races.find((x) => x.id === raceId);
    if (r) r.medal_url = localUri; // en mock, la foto local hace de URL
    await delay(null);
    return `mock/${raceId}.png`;
  },

  async uploadCheckinAudio() {
    await delay(null);
    return `mock/audio-${sc.checkins.length + 1}.caf`;
  },
};

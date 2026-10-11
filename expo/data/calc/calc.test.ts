// npm test → node --test. Node 22+ corre TypeScript directo (strip types).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Race, RaceResult, SessionView } from '../types';
import { addDays, daysBetween, mondayOf, todayLocal } from './dates.ts';
import { composeHistory, composeToday, composeTrophies, composeWeek } from './compose.ts';
import { fieldDisplay } from './profile.ts';
import { daysTo, formatDuration, nextRace, personalRecords, segmentSeconds, segmentState } from './races.ts';
import { recoveryLight } from './recovery.ts';
import { pctUnderCap } from './session.ts';
import { todayWeekState, z2Pct } from './week.ts';
import { buildScenario } from '../mocks/scenario.ts';

const TODAY = '2026-10-14'; // miércoles
const sc = buildScenario(TODAY);

// --- Foco de revisión ---------------------------------------------------------

test('semana inexistente → missingWeek true y nunca vacío', () => {
  const later = addDays(TODAY, 14);
  const t = composeToday(later, { ...sc });
  assert.equal(t.missingWeek, true);
  assert.equal(t.block, null);
  assert.deepEqual(t.sessions, []);
  // Sin semanas en absoluto, tampoco rompe.
  const empty = composeToday(TODAY, { ...sc, weeks: [], sessions: [] });
  assert.equal(empty.missingWeek, true);
  assert.equal(empty.proposedWeek, null);
});

test('semana proposed → proposedWeek no nulo y las sesiones se ven', () => {
  const t = composeToday(TODAY, { ...sc });
  assert.equal(t.missingWeek, false);
  assert.ok(t.proposedWeek);
  assert.equal(t.proposedWeek.status, 'proposed');
  assert.equal(t.sessions.length, 2);
  assert.deepEqual(t.block, { name: 'Base hacia el olímpico', week_index: 6 });

  const w = composeWeek(TODAY, { ...sc });
  assert.equal(w.week?.status, 'proposed');
  assert.equal(w.sessions.length, 8);
});

test("resultado con cancelled:['swim'] → PRs y totales no lo tratan como 0", () => {
  const sprint = sc.races.find((r) => r.id === 'race-past-sprint')!;
  assert.equal(segmentState(sprint.result, 'swim'), 'suspendido');
  assert.equal(segmentSeconds(sprint.result, 'swim'), null);
  assert.equal(segmentSeconds(sprint.result, 'bike'), 2710);

  // Un sprint completo más lento sigue siendo el récord: el suspendido no compite.
  const full: Race = { ...sprint, id: 'full', result: { ...sprint.result!, cancelled: undefined, total_s: 5400,
    splits: { swim_s: 800, bike_s: 2700, run_s: 1800 } } };
  const prs = personalRecords([sprint, full]);
  assert.deepEqual(prs.find((p) => p.kind === 'tri_sprint'), { kind: 'tri_sprint', best_s: 5400, race_id: 'full' });
  assert.equal(personalRecords([sprint]).length, 0);

  // Carrera sin tiempo: tampoco es un récord de 0.
  const prsAll = composeTrophies(sc.races).prs;
  assert.ok(prsAll.every((p) => p.best_s > 0));
  assert.equal(prsAll.find((p) => p.kind === 'run_10k'), undefined);
  assert.equal(formatDuration(null), null);
  assert.equal(formatDuration(0), null);
});

test('perfil con value null → no rompe y dice "sin dato"', () => {
  const r703 = sc.races.find((r) => r.id === 'race-next-703')!;
  const temp = fieldDisplay(r703.profile.swim?.temp_c, (v) => `${v} °C`);
  assert.deepEqual(temp, { text: 'sin dato', source: 'estimado', estimated: false, missing: true });
  assert.equal(fieldDisplay(r703.profile.run?.surface).text, 'sin dato');
  assert.equal(fieldDisplay(undefined).missing, true);
  const est = fieldDisplay(sc.races.find((r) => r.id === 'race-next-oly')!.profile.swim?.temp_c, (v) => `${v} °C`);
  assert.deepEqual(est, { text: '21 °C', source: 'estimado', estimated: true, missing: false });
});

// --- Fechas ---------------------------------------------------------------------

test('fechas en America/Chicago', () => {
  // 03:30 UTC del 11 son las 22:30 del 10 en Chicago.
  assert.equal(todayLocal(new Date('2026-10-11T03:30:00Z')), '2026-10-10');
  assert.equal(mondayOf('2026-10-11'), '2026-10-05'); // domingo → lunes anterior
  assert.equal(mondayOf('2026-10-12'), '2026-10-12');
  // El cambio de horario (1/11) no corre la cuenta.
  assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2);
  assert.equal(daysTo('2026-10-14', '2026-10-14'), 0);
});

// --- Semana -------------------------------------------------------------------

test('volumen por disciplina con unidades', () => {
  const w = composeWeek(TODAY, { ...sc });
  const swim = w.volume.find((v) => v.discipline === 'swim')!;
  assert.deepEqual(swim, { discipline: 'swim', planned: 2000, done: 2050, unit: 'm' });
  const run = w.volume.find((v) => v.discipline === 'run')!;
  assert.equal(run.unit, 'km');
  assert.equal(run.planned, 33);
  assert.equal(run.done, 7.1);
  assert.deepEqual(w.volume.find((v) => v.discipline === 'gym'), { discipline: 'gym', planned: 2, done: 0, unit: 'ses' });
});

test('pct_under_cap y z2Pct: sin dato es null, no 0', () => {
  assert.equal(pctUnderCap(150, { max_hr: 149 }), 100);
  assert.equal(pctUnderCap(150, { max_hr: 160 }), null);
  assert.equal(pctUnderCap(undefined, { max_hr: 120 }), null);
  assert.equal(pctUnderCap(150, { max_hr: 170, hr_samples: [140, 145, 155, 160] }), 50);
  assert.equal(z2Pct([]), null);
  const w = composeWeek(TODAY, { ...sc });
  // Nado 100 % bajo el techo; trote con máx 158 > 145 → sin dato, no cuenta.
  assert.equal(z2Pct(w.sessions), 100);
  const noData = w.sessions.map((s): SessionView => ({ ...s, actual: s.actual && { ...s.actual, pct_under_cap: null } }));
  assert.equal(z2Pct(noData), null);
});

test('sesión hecha trae datos reales y check-in; la otra sin check-in', () => {
  const t = composeToday(TODAY, { ...sc });
  const [swim, run] = t.sessions;
  assert.equal(swim.id, 'ses-swim-hoy');
  assert.equal(swim.actual?.distance_m, 2050);
  assert.equal(swim.checkin?.rpe, 5);
  assert.equal(run.status, 'done');
  assert.equal(run.checkin, undefined);
  assert.equal(run.actual?.avg_pace_s_per_km, Math.round((41 * 60 + 5) / 7.12));
});

test('historial: semanas anteriores, la más reciente primero', () => {
  const h = composeHistory(TODAY, sc);
  assert.equal(h.length, 1);
  assert.equal(h[0].id, 'wk-prev');
  assert.equal(h[0].sessions_done, 1);
});

test('todayWeekState: proposed de la semana que viene también avisa', () => {
  const next = { ...sc.weeks[1], id: 'n', monday: addDays(mondayOf(TODAY), 7) };
  const accepted = { ...sc.weeks[1], status: 'accepted' as const };
  const st = todayWeekState([sc.weeks[0], accepted, next], TODAY);
  assert.equal(st.missingWeek, false);
  assert.equal(st.proposed?.id, 'n');
});

// --- Carreras y recuperación ---------------------------------------------------

test('próxima carrera y cuenta regresiva', () => {
  const n = nextRace(sc.races, TODAY);
  assert.equal(n?.id, 'race-next-oly');
  assert.equal(n?.days_to, 21);
});

test('semáforo de recuperación', () => {
  assert.equal(recoveryLight(72), 'verde');
  assert.equal(recoveryLight(50), 'amarillo');
  assert.equal(recoveryLight(20), 'rojo');
  assert.equal(recoveryLight(null), null);
  assert.equal(composeToday(TODAY, { ...sc }).recovery?.light, 'verde');
});

test('formatDuration', () => {
  assert.equal(formatDuration(6312), '1:45:12');
  assert.equal(formatDuration(1755), '29:15');
  const r: RaceResult = { total_s: null, splits: {}, source: 'x' };
  assert.equal(segmentState(r, 'run'), 'sin_dato');
});

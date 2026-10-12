import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTime, buildManualResult, editionDifference, splitLayout, tiltStep, TILT_MAX, activityLabels } from './trophies.ts';

test('links a Strava: un tramo por actividad, en orden de carrera', () => {
  const waco = { total_s: 22260, splits: { bike_s: 12855, t2_s: 392, run_s: 9013 }, cancelled: ['swim' as const], source: 'x' };
  assert.deepEqual(activityLabels(waco, true, 3), ['Bici', 'T2', 'Trote']);
  assert.deepEqual(activityLabels(waco, true, 2), ['Actividad 1', 'Actividad 2']);
  assert.deepEqual(activityLabels(null, false, 1), ['Ver en Strava']);
});

test('tiempos manuales vacíos, válidos e inválidos', () => {
  assert.equal(parseTime(['', '', '']), null);
  assert.equal(parseTime(['', '42', '30']), 2550);
  for (const parts of [['0', '60', '00'], ['0', '00', '60'], ['-1', '00', '00'], ['x', '', ''], ['0', '0', '0']]) {
    assert.equal(parseTime(parts), 'invalid');
  }
});
test('un tramo suspendido se excluye aunque conserve un tiempo previo', () => {
  const result = buildManualResult({ total: ['', '', ''], splits: { swim: '0:20:00', bike: '0:45:10' }, cancelled: ['swim'], ranks: {}, division: '' });
  assert.ok(result);
  assert.equal(result.total_s, null);
  assert.deepEqual(result.splits, { bike_s: 2710 });
  assert.deepEqual(result.cancelled, ['swim']);
  const layout = splitLayout(result);
  assert.equal(layout.find(s => s.key === 'swim')?.width, 12);
  assert.equal(layout.find(s => s.key === 'bike')?.width, 88);
});
test('resultados inválidos no se guardan; campos opcionales vacíos no son ceros', () => {
  const base = { total: ['', '42', '30'], splits: {}, cancelled: [], ranks: {}, division: '' };
  assert.deepEqual(buildManualResult(base), { total_s: 2550, splits: {}, source: 'manual' });
  assert.equal(buildManualResult({ ...base, splits: { run: '1:60:00' } }), null);
  assert.equal(buildManualResult({ ...base, ranks: { rank_overall: '-1' } }), null);
});
test('ediciones sin tiempo o con tramos suspendidos no son comparables', () => {
  const a = { total_s: 2550, splits: {}, source: 'manual' };
  assert.equal(editionDifference(a, { ...a, total_s: 2820 }), 270);
  assert.equal(editionDifference(a, { ...a, total_s: null }), null);
  assert.equal(editionDifference({ ...a, cancelled: ['swim'] }, a), null);
  assert.equal(editionDifference(null, a), null);
});

test('inclinación: la primera lectura es el punto cero, aunque el teléfono esté inclinado', () => {
  const s = tiltStep(null, 50, -5);
  assert.deepEqual([s.x, s.y], [0, 0]);
  assert.deepEqual(s.base, { beta: 50, gamma: -5 });
});
test('inclinación: un movimiento chico se amplifica ×2,5', () => {
  const s = tiltStep({ beta: 50, gamma: 0 }, 54, -2);
  assert.equal(Math.round(s.x), 10);
  assert.equal(Math.round(s.y), -5);
});
test('inclinación: tope de ±30°', () => {
  const s = tiltStep({ beta: 50, gamma: 0 }, 90, -40);
  assert.deepEqual([s.x, s.y], [TILT_MAX, -TILT_MAX]);
  assert.equal(TILT_MAX, 30);
});
test('inclinación: si cambiás de postura, se recentra sola de a poco', () => {
  let s = tiltStep(null, 50, 0);
  s = tiltStep(s.base, 60, 0);
  const primero = s.x;
  for (let i = 0; i < 200; i++) s = tiltStep(s.base, 60, 0);
  assert.ok(primero > 20);
  assert.ok(s.x < 1);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTime, buildManualResult, editionDifference, splitLayout } from './trophies.ts';

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

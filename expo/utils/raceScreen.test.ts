import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startCountdown, strategyBullets, elevationGeometry, firstRaceDayVisit } from './raceScreen.ts';

test('la entrada automática ocurre una sola vez por carrera y día, incluso al reabrir', async () => {
  const values = new Map<string, string>();
  const storage = { getItem: async (key: string) => values.get(key) ?? null, setItem: async (key: string, value: string) => { values.set(key, value); } };
  assert.equal(await firstRaceDayVisit('a', '2026-10-11', storage), true);
  assert.equal(await firstRaceDayVisit('a', '2026-10-11', storage), false);
  assert.equal(await firstRaceDayVisit('b', '2026-10-11', storage), true);
  assert.equal(await firstRaceDayVisit('a', '2026-10-12', storage), true);
});

test('la cuenta regresiva usa el día y la hora local de largada', () => {
  const now = new Date(2026, 9, 11, 5, 15);
  assert.equal(startCountdown('2026-10-11', '07:30:00', now), 'Faltan 2 h 15');
  assert.equal(startCountdown('2026-10-11', '05:55:00', now), 'Faltan 40 min');
  assert.equal(startCountdown('2026-10-11', '05:15:00', now), '¡A correr!');
  assert.equal(startCountdown('2026-10-11', null, now), null);
  assert.equal(startCountdown('2026-10-12', '05:15:00', now), 'Faltan 24 h');
});

test('el plan del día conserva las primeras cinco viñetas, sin títulos ni negrita literal', () => {
  assert.deepEqual(strategyBullets('# Plan\nTexto\n- **Nado:** parejo\n* Bici\n1. Trote\n- T1\n- Nutrición\n- Extra'), ['Nado: parejo', 'Bici', 'Trote', 'T1', 'Nutrición']);
  assert.deepEqual(strategyBullets(null), []);
});

test('la altimetría tolera recorridos planos y sin distancia sin producir NaN', () => {
  assert.equal(elevationGeometry([]), null);
  assert.equal(elevationGeometry([[0, Number.NaN]]), null);
  for (const points of [[[0, 10], [40, 10]], [[0, 10]], [[0, 10], [0, 20]]] as [number, number][][]) {
    const geometry = elevationGeometry(points);
    assert.ok(geometry);
    assert.doesNotMatch(geometry.line, /NaN|Infinity/);
  }
  const geometry = elevationGeometry([[0, 210], [12, 330], [40, 215]]);
  assert.equal(geometry?.distance, 40);
  assert.equal(geometry?.max, 330);
});

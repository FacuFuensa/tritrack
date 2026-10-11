import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtDate, fmtDateLong, fmtMinutes, fmtDistance, fmtDuration, fmtPace, fmtSwimPace, fmtStartTime, daysToText, fmtWeekRange } from './format.ts';

test('fechas de calendario y rangos conservan el día local y los meses', () => {
  assert.equal(fmtDate('2026-10-14'), 'mié 14 oct');
  assert.equal(fmtDateLong('2026-10-14'), 'miércoles 14 de octubre');
  assert.equal(fmtWeekRange('2026-10-12'), '12 – 18 oct');
  assert.equal(fmtWeekRange('2026-09-28'), '28 sep – 4 oct');
});
test('unidades, coma decimal y redondeo del sueño', () => {
  assert.equal(fmtMinutes(45), '45 min');
  assert.equal(fmtMinutes(90), '1 h 30');
  assert.equal(fmtMinutes(7.6 * 60), '7 h 36');
  assert.equal(fmtDistance(2050, 'swim'), '2050 m');
  assert.equal(fmtDistance(7120, 'run'), '7,1 km');
  assert.equal(fmtDuration(2650), '44:10');
  assert.equal(fmtPace(341), '5:41 /km');
  assert.equal(fmtSwimPace(2650, 2050), '2:09 /100 m');
  assert.equal(fmtStartTime('07:30:00'), '7:30');
});
test('datos faltantes nunca se presentan como ceros y cuenta regresiva', () => {
  assert.equal(fmtDuration(null), 'sin dato');
  assert.equal(fmtDistance(null, 'bike'), 'sin dato');
  assert.equal(fmtPace(null), 'sin dato');
  assert.equal(fmtSwimPace(20, 0), 'sin dato');
  assert.equal(fmtStartTime(null), 'sin dato');
  assert.equal(daysToText(0), 'Es hoy');
  assert.equal(daysToText(1), 'Mañana');
  assert.equal(daysToText(21), 'Faltan 21 días');
});

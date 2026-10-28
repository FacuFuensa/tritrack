import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alternativesFor, groupOf, normalize, remember } from './gymExercises.ts';

test('el grupo se encuentra sin importar tildes, mayúsculas ni agregados', () => {
  assert.equal(normalize('  Sentadilla   Búlgara '), 'sentadilla bulgara');
  assert.equal(groupOf('sentadilla bulgara')?.name, 'Cuádriceps');
  assert.equal(groupOf('Peso muerto rumano con barra')?.name, 'Isquios y glúteos');
  assert.equal(groupOf('Plancha lateral')?.name, 'Core lateral');
  assert.equal(groupOf('Malabares'), null);
});

test('las variantes ya hechas van primero y no se repite el actual', () => {
  const alt = alternativesFor('Sentadilla búlgara', ['Remo con mancuerna', 'Prensa', 'Sentadilla bulgara', 'Estocadas']);
  assert.equal(alt.group, 'Cuádriceps');
  assert.deepEqual(alt.done, ['Prensa', 'Estocadas']);
  assert.ok(!alt.others.includes('Prensa'));
  assert.ok(!alt.others.includes('Sentadilla búlgara'));
  assert.ok(alt.others.includes('Sentadilla goblet'));
});

test('si lo cambiaste, el del plan aparece primero para volver', () => {
  const alt = alternativesFor('Prensa', [], 'Sentadilla búlgara');
  assert.equal(alt.done[0], 'Sentadilla búlgara');
  assert.ok(!alt.others.includes('Prensa'));
});

test('un ejercicio que no está en el catálogo no ofrece variantes', () => {
  assert.deepEqual(alternativesFor('Malabares', ['Prensa']), { group: null, done: [], others: [] });
});

test('el historial guarda el último primero y sin duplicados', () => {
  assert.deepEqual(remember(['Prensa', 'Estocadas'], 'estocadas'), ['estocadas', 'Prensa']);
  assert.equal(remember(['a', 'b', 'c'], 'd', 3).length, 3);
});

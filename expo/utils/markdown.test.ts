import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdown, inline } from './markdown.ts';
import { strategyBullets } from './raceScreen.ts';

test('markdown: títulos #, ## y ###', () => {
  assert.deepEqual(parseMarkdown('# Uno\n## Dos\n### Tres'), [
    { type: 'heading', level: 1, text: 'Uno' },
    { type: 'heading', level: 2, text: 'Dos' },
    { type: 'heading', level: 3, text: 'Tres' },
  ]);
});

test('markdown: una viñeta que sigue en la línea de abajo es una sola viñeta', () => {
  const md = '- **Neopreno**: casi seguro permitido. **Nunca nadaste\n  con traje**: probalo antes.\n- Sighting cada 6-8 brazadas.';
  assert.deepEqual(parseMarkdown(md), [
    { type: 'bullet', text: '**Neopreno**: casi seguro permitido. **Nunca nadaste con traje**: probalo antes.' },
    { type: 'bullet', text: 'Sighting cada 6-8 brazadas.' },
  ]);
});

test('markdown: listas numeradas conservan el número', () => {
  assert.deepEqual(parseMarkdown('1. Despertarse 4:45\n2. Desayuno'), [
    { type: 'bullet', marker: '1.', text: 'Despertarse 4:45' },
    { type: 'bullet', marker: '2.', text: 'Desayuno' },
  ]);
});

test('markdown: un párrafo partido en varias líneas es un solo párrafo; la línea vacía los separa', () => {
  assert.deepEqual(parseMarkdown('Objetivo **~50:00**.\nSe sale más lento.\n\nOtro párrafo.'), [
    { type: 'para', text: 'Objetivo **~50:00**. Se sale más lento.' },
    { type: 'para', text: 'Otro párrafo.' },
  ]);
});

test('markdown: una tabla pasa a filas con encabezado: valor, sin la línea separadora ni celdas vacías', () => {
  const md = '| Tramo | Rango | Central | Base |\n|---|---|---|---|\n| Nado 1.500 m | 40-48\' | **44\'** | Aguas abiertas |\n| **Total** | **3:25-3:59** | **3:41** | |';
  assert.deepEqual(parseMarkdown(md), [
    { type: 'row', title: 'Nado 1.500 m', cells: [{ label: 'Rango', value: '40-48\'' }, { label: 'Central', value: '**44\'**' }, { label: 'Base', value: 'Aguas abiertas' }] },
    { type: 'row', title: '**Total**', cells: [{ label: 'Rango', value: '**3:25-3:59**' }, { label: 'Central', value: '**3:41**' }] },
  ]);
});

test('markdown: tabla con primer encabezado vacío', () => {
  const md = '| | Rango | Base |\n|---|---|---|\n| 10K | 49:30-51:30 | Blue Bell |';
  assert.deepEqual(parseMarkdown(md), [
    { type: 'row', title: '10K', cells: [{ label: 'Rango', value: '49:30-51:30' }, { label: 'Base', value: 'Blue Bell' }] },
  ]);
});

test('inline: negrita en tramos y sin backticks', () => {
  assert.deepEqual(inline('Usá `tools/clima.mjs` y **techo 155** ya'), [
    { text: 'Usá tools/clima.mjs y ', bold: false },
    { text: 'techo 155', bold: true },
    { text: ' ya', bold: false },
  ]);
});

test('modo día: si hay sección "Modo día de carrera", usa sus viñetas', () => {
  const md = '## Nado\n- uno\n- dos\n- tres\n## Modo día de carrera\n- **Bici ≤ 162** en las subidas,\n  ≤ 150 al salir del agua\n- Comer cada 15\' por reloj\n## Otra\n- no';
  assert.deepEqual(strategyBullets(md), ['Bici ≤ 162 en las subidas, ≤ 150 al salir del agua', 'Comer cada 15\' por reloj']);
});

test('modo día: sin esa sección, las primeras 5 viñetas, enteras y sin markdown', () => {
  const md = '- **a** `x`\n  sigue\n- b\n- c\n- d\n- e\n- f';
  assert.deepEqual(strategyBullets(md), ['a x sigue', 'b', 'c', 'd', 'e']);
});

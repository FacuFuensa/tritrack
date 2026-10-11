// QA en modo mock. El puente se agrega temporalmente y se restaura al finalizar.
const { chromium } = require(process.env.TRITRACK_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const out = path.resolve(__dirname, '../../docs/capturas/trofeos');
const origin = process.env.TRITRACK_QA_URL || 'http://localhost:8084';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const layout = path.resolve(__dirname, '../app/_layout.tsx');
  const original = fs.readFileSync(layout, 'utf8');
  const bridge = `\nimport { queryClient } from '@/data/QueryProvider';\nimport { api } from '@/data/api';\nif (__DEV__ && DATA_MODE === 'mock') Object.assign(globalThis, { __tritrackQA: { queryClient, api } });\n`;
  let browser, page;
  try {
    fs.writeFileSync(layout, original.replace('const localOnly =', bridge + '\nconst localOnly ='));
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'America/Chicago' });
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR', e.message); });
    const text = value => page.getByText(value, { exact: true }).filter({ visible: true }).first();
    async function shot(name) { await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('CAPTURE', name); }
    async function go(url, title) { if (page.url().startsWith('http')) await page.evaluate(() => localStorage.clear()); await page.goto(origin + url); await text(title).waitFor({ timeout: 90000 }); }
    async function patch(patch) { await page.evaluate(patch => { const q = globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q => q.queryKey[0] === 'races'); globalThis.__savedState = q.state; q.setState({ ...patch, error: patch.error ? new Error('QA error') : null }); }, patch); await page.waitForTimeout(150); }
    async function restore() { await page.evaluate(() => { const q = globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q => q.queryKey[0] === 'races'); q.setState(globalThis.__savedState); }); }
    async function racePatch(id, patch) { await page.evaluate(({ id, patch }) => { const q = globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q => q.queryKey[0] === 'races'); globalThis.__savedState = q.state; q.setState({ data: q.state.data.map(r => r.id === id ? { ...r, ...patch } : r) }); }, { id, patch }); }
    await go('/trofeos', 'MEDALLAS');
    assert.equal(await page.getByRole('button', { name: /^Récord / }).count(), 1);
    assert.equal(await page.getByRole('button', { name: /^Ver trofeo/ }).count(), 3);
    assert.ok((await page.locator('body').innerText()).includes('1:17:10'));
    await shot('grilla');
    await patch({ data: [], status: 'success', fetchStatus: 'idle' }); await text('Todavía no hay medallas').waitFor(); await shot('grilla-vacia'); await restore();
    await patch({ data: undefined, status: 'pending', fetchStatus: 'fetching' }); await shot('grilla-cargando'); await restore();
    await patch({ data: undefined, status: 'error', fetchStatus: 'idle', error: true }); await text('No pudimos cargar esto').waitFor(); await shot('grilla-error'); await restore();
    await patch({ status: 'error', fetchStatus: 'idle', error: true }); await text('Sin conexión · estás viendo lo último que se cargó').waitFor(); await shot('grilla-sin-conexion'); await restore();
    await page.getByRole('button', { name: 'Cargar un resultado viejo', exact: true }).click();
    await page.getByRole('button', { name: '▸ Parciales y puestos (opcional)', exact: true }).click();
    await page.getByRole('textbox', { name: 'Tiempo total mm', exact: true }).fill('60');
    await text('Revisá el tiempo').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Guardar', exact: true }).isDisabled(), true);
    await shot('formulario-invalido');
    await page.getByRole('textbox', { name: 'Tiempo total mm', exact: true }).fill('42');
    await page.getByRole('textbox', { name: 'Tiempo total ss', exact: true }).fill('30');
    await shot('formulario-manual');
    await page.evaluate(() => { globalThis.__originalUpdate = globalThis.__tritrackQA.api.updateRace; globalThis.__tritrackQA.api.updateRace = async () => { throw Error('QA write error'); }; });
    await page.getByRole('button', { name: 'Guardar', exact: true }).click(); await text('No se pudo guardar. Probá de nuevo.').waitFor(); await shot('formulario-error');
    await page.evaluate(() => { globalThis.__tritrackQA.api.updateRace = globalThis.__originalUpdate; });
    await page.getByRole('button', { name: 'Guardar', exact: true }).click(); await page.getByRole('button', { name: 'Récord 10K 42:30', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Récord / }).count(), 2); await shot('grilla-resultado-guardado');
    await page.getByRole('button', { name: 'Ver trofeo de 10K Nocturno', exact: true }).click(); await text('TIEMPO TOTAL').waitFor(); await text('42:30').waitFor(); await shot('detalle-10k');
    assert.equal(await page.locator('svg pattern').count(), 0);
    await go('/trofeo/race-past-sprint', 'TIEMPO TOTAL'); await page.getByText('Nado suspendido', { exact: false }).filter({ visible: true }).first().waitFor();
    assert.ok(await page.locator('svg pattern').count() > 0);
    assert.equal(await page.getByText('Récord personal', { exact: true }).count(), 0);
    assert.ok(!(await page.locator('body').innerText()).includes('0:00'));
    await shot('detalle-nado-suspendido');
    const medal = page.getByLabel('Medalla inclinable', { exact: true });
    const bounds = await medal.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 60, bounds.y + bounds.height / 2 + 30, { steps: 8 }); await page.waitForTimeout(300);
    const transform = await medal.evaluate(el => getComputedStyle(el).transform);
    assert.ok(transform.includes('matrix3d')); await shot('detalle-medalla-inclinada'); await page.mouse.up();
    await text('PULSO POR TRAMO').scrollIntoViewIfNeeded(); await shot('detalle-puestos-pulso');
    await go('/trofeo/race-past-21k', 'TIEMPO TOTAL'); await text('Récord personal').waitFor(); await text('214 de 1830').waitFor(); await shot('detalle-media-maraton');
    await page.evaluate(() => { const q = globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q => q.queryKey[0] === 'races'); const race = q.state.data.find(r => r.id === 'race-past-21k'); q.setState({ data: [...q.state.data, { ...race, id: 'race-previous-edition', date: '2025-03-25', result: { ...race.result, total_s: 6500 } }] }); });
    await text('OTRAS EDICIONES').scrollIntoViewIfNeeded(); await text('+3:08').waitFor(); await shot('detalle-otras-ediciones');
    await go('/trofeo/race-past-10k', 'TIEMPO TOTAL'); await text('sin dato').waitFor(); await shot('detalle-sin-tiempo');
    await racePatch('race-past-10k', { result: null }); await text('Cargalo desde Trofeos → Cargar un resultado viejo.').waitFor(); await shot('detalle-resultado-null'); await restore();
    await patch({ data: undefined, status: 'pending', fetchStatus: 'fetching' }); await shot('detalle-cargando'); await restore();
    await patch({ data: undefined, status: 'error', fetchStatus: 'idle', error: true }); await text('No pudimos cargar esto').waitFor(); await shot('detalle-error'); await restore();
    await patch({ status: 'error', fetchStatus: 'idle', error: true }); await shot('detalle-sin-conexion'); await restore();
    await go('/trofeo/race-past-10k', 'TIEMPO TOTAL');
    const medalFixture = await page.getByLabel('Medalla inclinable', { exact: true }).screenshot();
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Cambiar medalla', exact: true }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: 'medalla-mock.png', mimeType: 'image/png', buffer: medalFixture });
    await page.getByRole('img', { name: 'Medalla de 10K', exact: true }).waitFor(); await shot('detalle-medalla-cambiada');
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await page.getByRole('tab', { name: 'Trofeos', exact: true }).click();
    await page.getByRole('img', { name: 'Medalla de 10K', exact: true }).waitFor(); await shot('grilla-medalla-cambiada');
    await go('/trofeo/inexistente', 'No encontramos este trofeo'); await shot('detalle-inexistente');
    await go('/trofeo/race-next-oly', 'Esta carrera todavía no se corrió'); await shot('detalle-no-corrida');
    await go('/trofeo/race-past-sprint', 'TIEMPO TOTAL');
    await racePatch('race-past-sprint', { result: null });
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await go('/trofeos', 'MEDALLAS');
    // La API se modifica solo en la sesión de QA para habilitar un triatlón elegible.
    await page.evaluate(() => { const q = globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q => q.queryKey[0] === 'races'); q.setState({ data: q.state.data.map(r => r.id === 'race-past-sprint' ? { ...r, result: null } : r) }); });
    await page.getByRole('button', { name: 'Cargar un resultado viejo', exact: true }).click();
    await page.getByRole('button', { name: /Triatlón Bahía Serena ·/ }).click();
    await page.getByRole('button', { name: '▸ Parciales y puestos (opcional)', exact: true }).click();
    await page.getByRole('textbox', { name: 'Parcial Bici', exact: true }).fill('0:45:10');
    await page.getByRole('switch', { name: 'Nado suspendido', exact: true }).click();
    await shot('formulario-parciales');
    await page.evaluate(() => { globalThis.__originalUpdate = globalThis.__tritrackQA.api.updateRace; globalThis.__tritrackQA.api.updateRace = (...args) => new Promise((resolve, reject) => { globalThis.__finishSave = () => globalThis.__originalUpdate(...args).then(resolve, reject); }); });
    await page.getByRole('button', { name: 'Guardar', exact: true }).click(); await shot('formulario-guardando');
    await page.evaluate(() => globalThis.__finishSave());
    await page.getByRole('button', { name: 'Ver trofeo de Triatlón Bahía Serena', exact: true }).click();
    await text('TIEMPO TOTAL').waitFor();
    const saved = await page.evaluate(() => globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q => q.queryKey[0] === 'races').state.data.find(r => r.id === 'race-past-sprint').result);
    assert.equal(saved.total_s, null); assert.deepEqual(saved.cancelled, ['swim']); assert.deepEqual(saved.splits, { bike_s: 2710 });
    assert.deepEqual(errors, []);
    console.log('PASS Trofeos: navegación, estados, guardado, PR, parciales suspendidos, arrastre y capturas.');
  } catch (error) {
    if (page) { console.error('QA BODY', await page.locator('body').innerText().catch(() => '')); await page.screenshot({ path: path.join(out, 'qa-fallo.png') }).catch(() => {}); }
    throw error;
  } finally { fs.writeFileSync(layout, original); await browser?.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

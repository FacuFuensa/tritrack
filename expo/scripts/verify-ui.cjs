// QA externo: Playwright se proporciona desde el runtime del desarrollador.
// No se agrega a las dependencias de la app ni se modifican expo/data/.
const { chromium } = require(process.env.TRITRACK_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const out = path.resolve(__dirname, '../../docs/capturas/hoy-semana');
fs.mkdirSync(out, {recursive:true});
(async () => {
  const layout = path.resolve(__dirname, '../app/_layout.tsx');
  const original = fs.readFileSync(layout, 'utf8');
  const bridge = `\nimport { queryClient } from '@/data/QueryProvider';\nimport { api } from '@/data/api';\nif (__DEV__ && DATA_MODE === 'mock') Object.assign(globalThis, { __tritrackQA: { queryClient, api } });\n`;
  let browser;
  try {
    fs.writeFileSync(layout, original.replace('const localOnly =', bridge + '\nconst localOnly ='));
    browser = await chromium.launch({channel:process.env.TRITRACK_BROWSER_CHANNEL || 'msedge', headless:true});
    const context = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:1, isMobile:true, hasTouch:true, timezoneId:'America/Chicago'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const wait = () => page.waitForTimeout(250);
    async function shot(name) { await wait(); await page.screenshot({path:path.join(out,name+'.png')}); console.log('CAPTURE',name); }
    async function go(url, text) { if(page.url().startsWith('http')) await page.evaluate(()=>localStorage.clear()); await page.goto('http://localhost:8081'+url); await page.getByText(text,{exact:true}).first().waitFor({timeout:60000}); await wait(); }
    async function state(prefix, patch) { await page.evaluate(({prefix,patch}) => {const q=globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q=>q.queryKey[0]===prefix); if(!q)throw Error('Missing query '+prefix); globalThis.__savedState=q.state; q.setState({...patch,error:patch.error ? new Error('QA offline') : null});}, {prefix,patch}); await wait(); }
    async function restore(prefix) { await page.evaluate(prefix=>{const q=globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q=>q.queryKey[0]===prefix);q.setState(globalThis.__savedState);},prefix); await wait(); }
    async function dataPatch(prefix, patch) { await page.evaluate(({prefix,patch})=>{const q=globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q=>q.queryKey[0]===prefix);globalThis.__savedState=q.state;q.setState({data:{...q.state.data,...patch}});},{prefix,patch});await wait(); }
    async function bottom() { await page.getByText('¿Cómo te fue?',{exact:true}).last().scrollIntoViewIfNeeded(); }
    await go('/hoy','Nado continuo');
    await shot('hoy-normal'); await bottom(); await shot('hoy-sesiones');
    await page.getByText('¿Cómo te fue?',{exact:true}).click();
    await page.getByText('¿Cómo te fue en Trote suave?',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Guardar',exact:true}).isDisabled(),true);
    await shot('checkin-plegada');
    await page.getByRole('button',{name:'6',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Guardar',exact:true}).isDisabled(),true);
    await page.getByRole('button',{name:'3',exact:true}).last().click();
    await page.getByRole('button',{name:'Guardar',exact:true}).click();
    await page.getByText('RPE 6 · energía 3/5',{exact:true}).waitFor();
    await shot('hoy-checkin-guardado');
    await go('/checkin?session=ses-swim-hoy','Ya cargaste uno. Si guardás de nuevo, vale el último.');
    assert.equal(await page.getByRole('button',{name:'5',exact:true}).first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(94, 159, 255)');
    await shot('checkin-precargada');
    await page.getByText('▸ Agregar molestia, geles o nota',{exact:true}).click();
    await page.getByRole('button',{name:'Rodilla',exact:true}).click();
    await page.getByRole('button',{name:'dolor',exact:true}).click();
    await page.getByRole('textbox',{name:'Nota',exact:true}).fill('Tirante al terminar las cuestas.');
    await shot('checkin-desplegada');
    await page.evaluate(()=>{globalThis.__tritrackQA.api.insertCheckin=async()=>{throw Error('QA save failure')};});
    await page.getByRole('button',{name:'Guardar',exact:true}).click();
    await page.getByText('No se pudo guardar. Revisá la conexión y probá de nuevo.',{exact:true}).waitFor();
    await shot('checkin-error-guardar');
    await go('/checkin?activity=123','¿Cómo te fue en tu entrenamiento?'); await shot('checkin-actividad');
    await go('/checkin','No sé de qué entrenamiento es'); await shot('checkin-sin-parametros');
    for(const [id,title,name] of [['ses-swim-hoy','Nado continuo','nado'],['ses-run-hoy','Trote suave','trote'],['ses-gym-1','Fuerza A','gimnasio'],['x','Esta sesión ya no existe','inexistente']]) {
      await go('/sesion/'+id,title); await shot('sesion-'+name);
      if(name==='nado') {await page.getByText('100 % del tiempo bajo el techo',{exact:true}).scrollIntoViewIfNeeded();await shot('sesion-nado-real');}
      if(name==='trote') {await page.getByText('Sin dato de pulso para calcular el tiempo bajo el techo',{exact:true}).scrollIntoViewIfNeeded();await shot('sesion-trote-real');}
    }
    await go('/sesion/ses-swim-hoy','Nado continuo');
    await state('session',{data:undefined,status:'pending',fetchStatus:'fetching'}); await shot('sesion-cargando'); await restore('session');
    await state('session',{data:undefined,status:'error',fetchStatus:'idle',error:true}); await shot('sesion-error'); await restore('session');
    await state('session',{status:'error',fetchStatus:'idle',error:true}); await shot('sesion-sin-conexion'); await restore('session');
    await go('/hoy','Nado continuo');
    await state('today',{data:undefined,status:'pending',fetchStatus:'fetching'}); await shot('hoy-cargando'); await restore('today');
    await state('today',{data:undefined,status:'error',fetchStatus:'idle',error:true}); await shot('hoy-error'); await restore('today');
    await state('today',{status:'error',fetchStatus:'idle',error:true}); await shot('hoy-sin-conexion'); await restore('today');
    await dataPatch('today',{missingWeek:true,proposedWeek:null,sessions:[]}); await shot('hoy-sin-semana'); await restore('today');
    await dataPatch('today',{missingWeek:false,proposedWeek:null,sessions:[],nextRace:null,block:null,recovery:null}); await shot('hoy-descanso-sin-whoop'); await restore('today');
    await page.evaluate(()=>{const q=globalThis.__tritrackQA.queryClient.getQueryCache().findAll().find(q=>q.queryKey[0]==='today');globalThis.__savedState=q.state;q.setState({data:{...q.state.data,recovery:{...q.state.data.recovery,date:'2026-10-01',recovery_pct:null,hrv_ms:null,rhr_bpm:null,sleep_h:null}}});}); await shot('hoy-recuperacion-anterior-sin-datos'); await restore('today');
    await go('/semana','PROPUESTA DEL COACH'); await shot('semana-propuesta');
    assert.ok((await page.locator('body').innerText()).includes('2050 / 2000 m'));
    assert.ok((await page.locator('body').innerText()).includes('Z2  100 %'));
    await page.getByRole('button',{name:'Aceptar',exact:true}).click(); await page.getByText('BRIEFING',{exact:true}).waitFor(); await shot('semana-aceptada');
    await page.getByRole('tab',{name:'Hoy',exact:true}).click();
    await page.getByText('Tu semana está lista',{exact:true}).waitFor({state:'hidden'});
    await go('/semana','PROPUESTA DEL COACH');
    await page.getByRole('button',{name:'Pedir cambios',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Mandar',exact:true}).isDisabled(),true);
    await page.getByRole('textbox',{name:'Qué querés que cambie',exact:true}).fill('Pasar la bici al jueves.'); await shot('semana-pedir-cambios');
    await page.getByRole('button',{name:'Mandar',exact:true}).click(); await page.getByText('PEDISTE CAMBIOS',{exact:true}).waitFor(); await shot('semana-cambios-pedidos');
    await go('/semana','PROPUESTA DEL COACH');
    await page.evaluate(()=>{globalThis.__tritrackQA.api.setWeekStatus=async()=>{throw Error('QA write failure')};});
    await page.getByRole('button',{name:'Aceptar',exact:true}).click(); await page.getByText('No se pudo aceptar. Probá de nuevo.',{exact:true}).waitFor(); await shot('semana-error-aceptar');
    await page.getByRole('button',{name:'Pedir cambios',exact:true}).click(); await page.getByRole('textbox',{name:'Qué querés que cambie',exact:true}).fill('Menos volumen por favor.'); await page.getByRole('button',{name:'Mandar',exact:true}).click(); await page.getByText('No se pudo mandar. Probá de nuevo.',{exact:true}).waitFor(); await shot('semana-error-cambios');
    await go('/semana','PROPUESTA DEL COACH');
    await page.getByText('SEMANAS ANTERIORES',{exact:true}).scrollIntoViewIfNeeded(); await shot('semana-historial');
    await page.getByRole('button',{name:'Semana anterior',exact:true}).click(); await page.getByText('Volumen aeróbico',{exact:true}).first().waitFor(); await shot('semana-anterior');
    await page.getByRole('button',{name:'Semana anterior',exact:true}).click(); await page.getByText('No hay plan para esta semana',{exact:true}).waitFor(); await shot('semana-vacia');
    await go('/semana','PROPUESTA DEL COACH');
    await state('week',{data:undefined,status:'pending',fetchStatus:'fetching'}); await shot('semana-cargando'); await restore('week');
    await state('week',{data:undefined,status:'error',fetchStatus:'idle',error:true}); await shot('semana-error'); await restore('week');
    await state('week',{status:'error',fetchStatus:'idle',error:true}); await shot('semana-sin-conexion'); await restore('week');
    await dataPatch('week',{volume:[],z2Pct:null}); await shot('semana-volumen-vacio-z2-sin-dato'); await restore('week');
    await go('/checkin?session=ses-run-hoy','¿Cómo te fue en Trote suave?');
    await state('session',{data:undefined,status:'pending',fetchStatus:'fetching'}); await shot('checkin-cargando-sesion'); await restore('session');
    await state('session',{data:null,status:'error',fetchStatus:'idle',error:true}); await shot('checkin-error-sesion'); await restore('session');
    await page.getByRole('button',{name:'6',exact:true}).click(); await page.getByRole('button',{name:'3',exact:true}).last().click();
    await page.evaluate(()=>{globalThis.__tritrackQA.api.insertCheckin=()=>new Promise(()=>{});}); await page.getByRole('button',{name:'Guardar',exact:true}).click(); await shot('checkin-guardando');
    await go('/sesion/ses-prev-2','Trote'); await shot('sesion-salteada');
    await go('/sesion/ses-swim-hoy','Nado continuo');
    await dataPatch('session',{actual:undefined,checkin:undefined}); await page.getByText('Strava no trajo datos de esta actividad.',{exact:true}).scrollIntoViewIfNeeded(); await shot('sesion-hecha-sin-actividad'); await restore('session');
    await dataPatch('session',{title:null,discipline:null,status:'planned',prescription:{why:'Entrená suave y parejo.'}}); await shot('sesion-sin-disciplina-sin-pasos'); await restore('session');
    await go('/semana','PROPUESTA DEL COACH');
    await page.getByRole('button',{name:'Semana siguiente',exact:true}).click(); await page.getByText('No hay plan para esta semana',{exact:true}).waitFor(); await shot('semana-futura-vacia');
    await go('/semana','PROPUESTA DEL COACH');
    await state('weekHistory',{data:undefined,error:true,status:'error',fetchStatus:'idle'}); await shot('semana-historial-error'); await restore('weekHistory');
    await go('/carreras','Próximamente'); await shot('carreras');
    await go('/trofeos','Próximamente'); await shot('trofeos');
    await go('/ruta-inexistente','No encontramos esta pantalla'); await shot('ruta-inexistente');
    assert.deepEqual(errors,[]);
    console.log('PASS UI flows, screenshots, no runtime errors');
  } finally { fs.writeFileSync(layout, original); await browser?.close(); }
})().catch(e => {console.error(e);process.exitCode=1});

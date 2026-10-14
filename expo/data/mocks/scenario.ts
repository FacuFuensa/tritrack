// Escenario de prueba completo e INVENTADO (el repo es público: nada de esto
// es de una persona real). Las fechas se arman relativas a `today`, así Hoy
// siempre tiene algo que mostrar.
//
// - Semana actual 'proposed' con 8 sesiones. Hoy hay dos: el nado de la mañana
//   hecho con datos reales y check-in; el trote de la tarde hecho sin check-in.
// - Semana anterior aceptada, con su briefing.
// - Recuperación de los últimos días.
// - 3 carreras pasadas (una con el nado suspendido, otra sin tiempo) y 2
//   futuras con perfil y clima.
import { addDays, mondayOf } from '../calc/dates.ts';
import type { ActivityRow, BlockRow, RecoveryRow, WeekRow } from '../calc/rows.ts';
import type { Checkin, PlanSession, Race } from '../types';

export interface Scenario {
  block: BlockRow;
  weeks: WeekRow[];
  sessions: PlanSession[];
  activities: ActivityRow[];
  checkins: Checkin[];
  recovery: RecoveryRow[];
  races: Race[];
}

export function buildScenario(today: string): Scenario {
  const monday = mondayOf(today);
  const prevMonday = addDays(monday, -7);
  // Día de la semana actual distinto de hoy, para repartir el resto.
  const otherDay = (i: number) => {
    const d = addDays(monday, i);
    return d === today ? addDays(monday, (i + 1) % 7) : d;
  };

  const block: BlockRow = { id: 'blk-1', name: 'Base hacia el olímpico', start_monday: addDays(monday, -35) };

  const weeks: WeekRow[] = [
    {
      id: 'wk-prev', block_id: block.id, monday: prevMonday, week_index: 5, kind: 'build',
      focus: 'Volumen aeróbico', status: 'accepted',
      briefing_md: 'Semana sólida: cumpliste 6 de 7.\n\nEl fondo del domingo salió parejo, sin pasar el techo.',
      feedback: null,
    },
    {
      id: 'wk-cur', block_id: block.id, monday, week_index: 6, kind: 'build',
      focus: 'Cuestas y nado continuo', status: 'proposed',
      briefing_md: 'Subimos un poco la bici y metemos cuestas cortas.\n\nRecuperación buena toda la semana: hay margen.',
      feedback: null,
    },
  ];

  const s = (
    id: string, date: string, slot: 'AM' | 'PM', discipline: PlanSession['discipline'],
    title: string, prescription: PlanSession['prescription'],
    extra: Partial<PlanSession> = {},
  ): PlanSession => ({
    id, week_id: date >= monday ? 'wk-cur' : 'wk-prev', date, slot, order_index: 0, optional: false,
    title, discipline, prescription, status: 'planned', activity_id: null, ...extra,
  });

  const sessions: PlanSession[] = [
    // Hoy: nado hecho con check-in, trote hecho sin check-in.
    s('ses-swim-hoy', today, 'AM', 'swim', 'Nado continuo', {
      dur_min: 45, distance_m: 2000, hr_cap: 150, why: 'Aguantar ritmo parejo sin parar.',
      steps: [
        { label: 'Entrada en calor', distance_m: 300, note: 'Suave, alternando estilos' },
        { label: 'Continuo', distance_m: 1500, target: 'Ritmo de carrera', hr_cap: 150 },
        { label: 'Vuelta a la calma', distance_m: 200 },
      ],
    }, { status: 'done', activity_id: 'act-swim-hoy' }),
    s('ses-run-hoy', today, 'PM', 'run', 'Trote suave', {
      dur_min: 40, distance_m: 7000, hr_cap: 145, pace: '5:40', why: 'Sumar minutos sin cansar.',
      tags: ['fondo'],
    }, { status: 'done', activity_id: 'act-run-hoy', order_index: 1 }),
    // El resto de la semana.
    s('ses-gym-1', otherDay(0), 'AM', 'gym', 'Fuerza A', {
      dur_min: 50, why: 'Piernas fuertes para las cuestas.', tags: ['pierna_pesada'],
      exercises: [
        { name: 'Sentadilla búlgara', sets: 3, reps: '8 por pierna', cue: 'Rodilla alineada con el pie' },
        { name: 'Peso muerto rumano', sets: 3, reps: '10', cue: 'Espalda neutra' },
        { name: 'Plancha lateral', sets: 3, reps: '30 s', cue: 'Cadera alta' },
      ],
    }),
    s('ses-bike-cuestas', otherDay(1), 'AM', 'bike', 'Cuestas cortas', {
      dur_min: 75, distance_m: 32000, hr_cap: 165, why: 'Para las subidas de la carrera A.',
      tags: ['especifico'],
      steps: [
        { label: 'Entrada en calor', dur_min: 15 },
        { label: 'Cuesta', dur_min: 3, reps: 6, target: 'Fuerte, sentado', hr_cap: 165 },
        { label: 'Bajada suave', dur_min: 3, reps: 6 },
        { label: 'Vuelta a la calma', dur_min: 15 },
      ],
    }),
    s('ses-run-calidad', otherDay(2), 'AM', 'run', 'Series de 1 km', {
      dur_min: 55, distance_m: 10000, hr_cap: 172, pace: '4:45', tags: ['calidad_carrera'],
      steps: [{ label: '1 km', reps: 5, target: '4:45 /km' }, { label: 'Pausa trotando', dur_min: 2, reps: 5 }],
    }),
    s('ses-gym-2', otherDay(3), 'PM', 'gym', 'Fuerza B', {
      dur_min: 40, exercises: [{ name: 'Remo con mancuerna', sets: 3, reps: '12' }],
    }),
    s('ses-brick', otherDay(5), 'AM', 'brick', 'Bici + trote', {
      dur_min: 120, distance_m: 45000, hr_cap: 155, tags: ['simulacro'],
      why: 'Practicar la transición con las piernas cansadas.',
    }),
    s('ses-run-largo', otherDay(6), 'AM', 'run', 'Fondo', {
      dur_min: 90, distance_m: 16000, hr_cap: 150, tags: ['fondo'],
    }),
    // Semana anterior (para el historial).
    s('ses-prev-1', addDays(prevMonday, 1), 'AM', 'bike', 'Rodaje', { dur_min: 60, distance_m: 25000 },
      { status: 'done', activity_id: 'act-prev-1' }),
    s('ses-prev-2', addDays(prevMonday, 3), 'AM', 'run', 'Trote', { dur_min: 45, distance_m: 8000 },
      { status: 'skipped' }),
  ];

  const startedAt = (d: string, hour: number) => `${d}T${String(hour + 5).padStart(2, '0')}:00:00Z`;
  const activities: ActivityRow[] = [
    { external_id: 'act-swim-hoy', date: today, started_at: startedAt(today, 6), discipline: 'swim',
      distance_m: 2050, moving_s: 44 * 60 + 10, avg_hr: 138, max_hr: 149 },
    { external_id: 'act-run-hoy', date: today, started_at: startedAt(today, 18), discipline: 'run',
      distance_m: 7120, moving_s: 41 * 60 + 5, avg_hr: 141, max_hr: 158 },
    { external_id: 'act-prev-1', date: addDays(prevMonday, 1), started_at: startedAt(addDays(prevMonday, 1), 7),
      discipline: 'bike', distance_m: 26300, moving_s: 3720, avg_hr: 132, max_hr: 151 },
    // Actividad sin sesión: igual queda en activities.
    { external_id: 'act-extra', date: addDays(prevMonday, 2), started_at: startedAt(addDays(prevMonday, 2), 19),
      discipline: 'bike', distance_m: 9000, moving_s: 1500, avg_hr: 120, max_hr: 131 },
  ];

  const checkins: Checkin[] = [
    { id: 'chk-1', date: today, session_id: 'ses-swim-hoy', activity_id: 'act-swim-hoy', rpe: 5, energia: 4,
      molestia: { zona: 'hombro derecho', nivel: 1 }, nutricion: null, nota: 'Agua fría, costó arrancar.',
      transcripcion: null, audio_path: null, audio_s: null, created_at: `${today}T13:00:00Z` },
  ];

  const recovery: RecoveryRow[] = [0, 1, 2].map((i) => ({
    date: addDays(today, -i),
    recovery_pct: [72, 55, 28][i],
    hrv_ms: [68, 59, 41][i],
    rhr_bpm: [48, 51, 56][i],
    sleep_h: [7.6, 6.9, 5.2][i],
    sleep_perf_pct: [91, 80, 62][i],
    strain: [9.8, 14.1, 16.5][i],
  }));

  const race = (r: Partial<Race> & Pick<Race, 'id' | 'name' | 'date' | 'kind'>): Race => ({
    location: null, priority: null, status: 'planned', start_local: null, logistics: {}, profile: {},
    climate: null, strategy_md: null, result: null, medal_path: null, medal_url: null, activity_ids: [], ...r,
  });

  const races: Race[] = [
    race({
      id: 'race-past-21k', name: 'Medio Maratón del Lago', date: addDays(today, -200), kind: 'run_21k',
      location: 'Villa Lago', status: 'done', priority: 'B',
      result: { total_s: 6312, splits: {}, rank_overall: 214, field_overall: 1830, division: 'M35-39',
        rank_division: 31, field_division: 260, hr_by_segment: { run: 162 }, source: 'resultados oficiales' },
    }),
    race({
      id: 'race-past-sprint', name: 'Triatlón Bahía Serena', date: addDays(today, -120), kind: 'tri_sprint',
      location: 'Bahía Serena', status: 'done', priority: 'A',
      // Nado suspendido por el oleaje: se corrió como duatlón.
      result: { total_s: 4630, splits: { t1_s: 95, bike_s: 2710, t2_s: 70, run_s: 1755 },
        cancelled: ['swim'], division: 'M35-39', rank_division: 12, field_division: 88,
        hr_by_segment: { bike: 158, run: 166 }, source: 'resultados oficiales' },
    }),
    race({
      id: 'race-past-10k', name: '10K Nocturno', date: addDays(today, -60), kind: 'run_10k',
      location: 'Ciudad Puerto', status: 'done', priority: 'C',
      // Sin tiempo: el chip falló. Se muestra "sin dato", nunca 0:00.
      result: { total_s: null, splits: {}, source: 'manual' },
    }),
    race({
      id: 'race-next-oly', name: 'Triatlón Olímpico Cerro Azul', date: addDays(today, 21), kind: 'tri_olympic',
      location: 'Cerro Azul', status: 'registered', priority: 'A', start_local: '07:30:00',
      logistics: { inscripcion_cierra: addDays(today, 5), retiro_kit: 'El día anterior, 14 a 19 h, en el club náutico',
        viaje: '2 h en auto', url: 'https://example.com/cerro-azul' },
      strategy_md: '- Nado: salir por afuera, ritmo parejo.\n- Bici: cuestas sentado, sin pasar 165.\n- Trote: primeros 2 km contenidos.',
      profile: {
        swim: { distance_m: { value: 1500, source: 'oficial' }, water_type: { value: 'lago', source: 'oficial' },
          temp_c: { value: 21, source: 'estimado', note: 'Promedio de años anteriores' },
          wetsuit: { value: 'Permitido', source: 'oficial' }, salt: { value: false, source: 'oficial' } },
        bike: { distance_km: { value: 40, source: 'oficial' }, elev_gain_m: { value: 520, source: 'medido' },
          key_climbs: { value: ['Subida del mirador (km 12)', 'Repecho final (km 36)'], source: 'medido' },
          aid_stations: { value: null, source: 'oficial' },
          profile_points: { value: [[0, 210], [10, 260], [12, 330], [20, 250], [30, 240], [36, 300], [40, 215]], source: 'medido' } },
        run: { distance_km: { value: 10, source: 'oficial' }, elev_gain_m: { value: 60, source: 'estimado' },
          loops: { value: 2, source: 'oficial' }, surface: { value: 'Asfalto y ripio', source: 'oficial' },
          profile_points: { value: [[0, 215], [2.5, 230], [5, 215], [7.5, 230], [10, 215]], source: 'estimado' } },
      },
      climate: {
        by_segment: [
          { segment: 'swim', hour_local: 7, temp_c_median: 14, temp_c_min: 9, temp_c_max: 18, dewpoint_c_median: 10, feels_max_c: 18, rain_years: 2, years: 10 },
          { segment: 'bike', hour_local: 8, temp_c_median: 17, temp_c_min: 12, temp_c_max: 22, dewpoint_c_median: 11, feels_max_c: 23, rain_years: 2, years: 10 },
          { segment: 'run', hour_local: 10, temp_c_median: 22, temp_c_min: 16, temp_c_max: 28, dewpoint_c_median: 13, feels_max_c: 29, rain_years: 1, years: 10 },
        ],
        updated_at: `${addDays(today, -1)}T12:00:00Z`,
      },
    }),
    race({
      id: 'race-next-703', name: 'Medio Ironman Río Claro', date: addDays(today, 160), kind: 'tri_703',
      location: 'Río Claro', status: 'planned', priority: 'A', start_local: '06:45:00',
      logistics: { inscripcion_cierra: addDays(today, 60) },
      profile: {
        swim: { distance_m: { value: 1900, source: 'oficial' }, water_type: { value: 'rio', source: 'oficial' },
          temp_c: { value: null, source: 'estimado', note: 'Todavía no hay datos del río' } },
        bike: { distance_km: { value: 90, source: 'oficial' }, elev_gain_m: { value: 900, source: 'estimado' } },
        run: { distance_km: { value: 21.1, source: 'oficial' }, loops: { value: 3, source: 'oficial' } },
      },
      climate: {
        by_segment: [
          { segment: 'race', hour_local: 9, temp_c_median: 27, temp_c_min: 21, temp_c_max: 33, dewpoint_c_median: 19, feels_max_c: 36, rain_years: 3, years: 10 },
        ],
        forecast: { fetched_at: `${today}T10:00:00Z`, temp_c: 26, feels_c: 28, wind_kmh: 14, rain_pct: 20 },
        updated_at: `${today}T10:00:00Z`,
      },
    }),
  ];

  return { block, weeks, sessions, activities, checkins, recovery, races };
}

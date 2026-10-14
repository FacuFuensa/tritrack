# Contratos de datos

Lo que una pantalla puede asumir. Los tipos viven en
[`expo/data/types.ts`](../expo/data/types.ts) y los hooks en `expo/data/`.
Este documento es la referencia para construir pantallas; si el código y este
archivo no coinciden, avisá en el PR.

## C1 · Deep links

Esquema `tritrack://`. La app los recibe desde notificaciones y desde el OAuth.

| Link | Abre |
|---|---|
| `tritrack://hoy` | Pestaña Hoy |
| `tritrack://semana` | Pestaña Semana (la notificación "Tu semana está lista" lleva acá) |
| `tritrack://checkin?session=<uuid>` | Hoja de check-in de esa sesión del plan |
| `tritrack://checkin?activity=<external_id>` | Hoja de check-in de una actividad de Strava sin sesión |
| `tritrack://checkin?sessions=<uuid>,<uuid>` | Un solo audio para varias sesiones del mismo día (botón de Hoy) |
| `tritrack://carrera/<race_id>` | Detalle de carrera |
| `tritrack://trofeo/<race_id>` | Detalle de trofeo |
| `tritrack://oauth?provider=strava\|whoop&ok=1\|0[&error=…]` | Vuelta del OAuth (lo maneja Ajustes; no es para pantallas) |

Las notificaciones push traen el link en `data.url`.

## C4 · Formas de los datos

Copiado de `expo/data/types.ts`.

### Plan y sesiones

```ts
type Discipline = 'swim' | 'bike' | 'run' | 'brick' | 'gym' | 'rest';
type SessionTag = 'pierna_pesada' | 'calidad_carrera' | 'fondo' | 'especifico' | 'simulacro';

interface Step { label: string; dur_min?: number; distance_m?: number; reps?: number;
  target?: string; hr_cap?: number; note?: string }
interface Exercise { name: string; sets: number; reps: string; cue?: string }
interface Prescription { dur_min?: number; distance_m?: number; hr_cap?: number;
  pace?: string; steps?: Step[]; exercises?: Exercise[]; why?: string; tags?: SessionTag[] }
```

- `hr_cap`: techo de pulso en lpm. Es el número dominante de la tarjeta.
- `pace`: texto, por ejemplo `"5:40"` (min/km).
- `why`: el "para qué", visible en el detalle.
- Una sesión de nado o trote trae `steps`; una de gimnasio, `exercises`.
  Cualquiera de los dos puede faltar.

```ts
type WeekStatus = 'proposed' | 'accepted' | 'changes_requested';
type WeekKind = 'reset' | 'build' | 'peak' | 'absorb' | 'taper' | 'race';
type SessionStatus = 'planned' | 'done' | 'skipped';

interface WeekSummary {
  id: string; monday: string; week_index: number; kind: WeekKind; focus: string | null;
  status: WeekStatus; briefing_md: string | null; feedback: string | null;
  block_name: string | null;
  sessions_planned: number; sessions_done: number; minutes_planned: number;
}

interface PlanSession {
  id: string; week_id: string; date: string; slot: 'AM' | 'PM'; order_index: number;
  optional: boolean; title: string | null; discipline: Discipline | null;
  prescription: Prescription; status: SessionStatus; activity_id: string | null;
}

interface ActualData {            // de la actividad de Strava que cumplió la sesión
  distance_m: number | null; moving_s: number | null;
  avg_hr: number | null; max_hr: number | null;
  avg_pace_s_per_km: number | null;
  pct_under_cap: number | null;   // % del tiempo bajo hr_cap; null = "sin dato"
}

interface Molestia { zona: string; nivel: 0 | 1 | 2 | 3 }   // nada / tirante / dolor / calambre
interface Nutricion { geles?: number; liquido_ml?: number }

interface Checkin {
  id: string; date: string; session_id: string | null; activity_id: string | null;
  rpe: number | null; energia: number | null;           // 1-10 y 1-5
  molestia: Molestia | null; nutricion: Nutricion | null; nota: string | null;
  transcripcion: string | null;   // el audio pasado a texto en el iPhone
  audio_path: string | null;      // checkins-audio/<user_id>/…; varias sesiones pueden compartirlo
  audio_s: number | null;
  created_at: string;
}

interface SessionView extends PlanSession { actual?: ActualData; checkin?: Checkin }

interface CheckinInput {          // session_id o activity_id, uno de los dos
  date: string; session_id?: string; activity_id?: string;
  rpe?: number; energia?: number;
  molestia?: Molestia; nutricion?: Nutricion; nota?: string;
  transcripcion?: string; audio_path?: string; audio_s?: number;
}

interface VoiceCheckinInput {     // un audio, una fila por sesión que cubre
  date: string;
  targets: ({ session_id: string } | { activity_id: string })[];
  transcripcion: string; audioUri: string | null; audio_s?: number;
}
```

Fechas: siempre texto `AAAA-MM-DD` en la hora local del atleta. Las semanas
empiezan el lunes.

### Recuperación

```ts
interface Recovery {
  date: string;                   // día del dato; puede ser anterior a hoy
  recovery_pct: number | null; hrv_ms: number | null; rhr_bpm: number | null;
  sleep_h: number | null; sleep_perf_pct: number | null; strain: number | null;
  light: 'verde' | 'amarillo' | 'rojo' | null;   // ≥67 / 34-66 / ≤33
}
```

### Carreras

```ts
type RaceKind = 'run_5k' | 'run_10k' | 'run_21k' | 'run_42k'
  | 'tri_sprint' | 'tri_olympic' | 'tri_703' | 'tri_full' | 'other';
type RaceStatus = 'planned' | 'registered' | 'done' | 'dns';

interface Race {
  id: string; name: string; date: string; location: string | null;
  kind: RaceKind; priority: 'A' | 'B' | 'C' | null; status: RaceStatus;
  start_local: string | null;     // 'HH:MM:SS'
  logistics: { inscripcion_cierra?: string; retiro_kit?: string; viaje?: string; url?: string };
  profile: RaceProfile; climate: RaceClimate | null; strategy_md: string | null;
  result: RaceResult | null;
  medal_path: string | null; medal_url: string | null;   // medal_url lista para <Image>
  activity_ids: string[];
}

type RaceSummary = Pick<Race, 'id' | 'name' | 'date' | 'location' | 'kind' | 'priority' | 'status'>;

type Source = 'medido' | 'oficial' | 'estimado';
interface Field<T> { value: T | null; source: Source; note?: string }

interface RaceProfile {
  swim?: { distance_m?: Field<number>; water_type?: Field<'mar'|'lago'|'rio'|'pileta'>;
           salt?: Field<boolean>; temp_c?: Field<number>; wetsuit?: Field<string>;
           start_type?: Field<string>; course_shape?: Field<string> };
  bike?: { distance_km?: Field<number>; elev_gain_m?: Field<number>; key_climbs?: Field<string[]>;
           aid_stations?: Field<string>; roads?: Field<string>; profile_points?: Field<[number, number][]> };
  run?:  { distance_km?: Field<number>; elev_gain_m?: Field<number>; loops?: Field<number>;
           surface?: Field<string>; profile_points?: Field<[number, number][]> };
}
// profile_points: [km, altura en m]

interface ClimateRow { segment: 'swim'|'bike'|'run'|'race'; hour_local: number;
  temp_c_median: number; temp_c_min: number; temp_c_max: number; dewpoint_c_median: number;
  feels_max_c: number; rain_years: number; years: number }
interface RaceClimate { by_segment: ClimateRow[]; forecast?: { fetched_at: string;
  temp_c: number; feels_c: number; wind_kmh: number; rain_pct: number }; updated_at: string }

interface RaceResult { total_s: number | null;
  splits: { swim_s?: number; t1_s?: number; bike_s?: number; t2_s?: number; run_s?: number };
  cancelled?: ('swim'|'bike'|'run')[]; division?: string; rank_division?: number;
  field_division?: number; rank_overall?: number; field_overall?: number;
  hr_by_segment?: { swim?: number; bike?: number; run?: number }; source: string }
```

Reglas de los datos que faltan (las pantallas las respetan):

| Caso | Se muestra |
|---|---|
| Tramo en `result.cancelled` | "suspendido" |
| `total_s` null, o un split que falta | "sin dato" (nunca `0:00`) |
| `Field.value` null | "sin dato" |
| `Field.source === 'estimado'` | el valor con la marca "estimado" |
| `pct_under_cap` o `z2Pct` null | "sin dato" |

Ayudas puras para esto en `expo/data/calc/` (se pueden importar):
`formatDuration(s)` → `"1:02:03"` o `null`; `segmentState(result, 'swim')` →
`'ok' | 'suspendido' | 'sin_dato'`; `segmentSeconds(result, seg)`;
`fieldDisplay(field, format?)` → `{ text, source, estimated, missing }`.

## C5 · Hooks

Todos los que leen devuelven el resultado de `useQuery` de TanStack Query:
`{ data, isLoading, error, refetch, … }`. El cache está persistido: sin red,
`data` trae lo último que se cargó (y `error` puede venir con valor al mismo
tiempo; si hay `data`, mostrala). Con `EXPO_PUBLIC_DATA_MODE=mock` leen de
`expo/data/mocks/`.

| Hook | `data` |
|---|---|
| `useToday(date?: string)` | `TodayData` (abajo) |
| `useWeek(monday?: string)` | `{ week: WeekSummary \| null; sessions: SessionView[]; volume: VolumeRow[]; z2Pct: number \| null }` |
| `useWeekHistory()` | `WeekSummary[]` — semanas anteriores, la más reciente primero |
| `useSession(id: string)` | `SessionView \| null` (null si no existe) |
| `useRaces()` | `{ upcoming: Race[]; past: Race[] }` — próximas de la más cercana; pasadas de la última |
| `useRace(id: string)` | `Race \| null` |
| `useTrophies()` | `{ prs: { kind: RaceKind; best_s: number; race_id: string }[]; medals: Race[] }` |
| `useConnections()` | estado de Strava y Whoop (solo Ajustes) |

```ts
interface TodayData {
  date: string;
  block: { name: string; week_index: number } | null;
  nextRace: (RaceSummary & { days_to: number }) | null;   // days_to 0 = hoy
  recovery: Recovery | null;
  sessions: SessionView[];        // las de `date`, en orden AM → PM
  proposedWeek: WeekSummary | null;  // semana propuesta sin aceptar: mostrar banner
  missingWeek: boolean;           // no hay semana para la fecha: mostrar aviso
}

interface VolumeRow { discipline: Discipline; planned: number; done: number;
  unit: 'm' | 'km' | 'ses' }      // nado en m, bici y trote en km, brick y gym en sesiones
```

- `useWeek`: `monday` puede ser cualquier día de esa semana; por defecto, la
  actual.
- Una semana `proposed` es entrenable: sus sesiones vienen en `sessions` igual
  que las de una aceptada.
- `z2Pct`: % del tiempo hecho bajo el techo de pulso de cada sesión, pesado
  por minutos. `null` si ninguna sesión hecha tiene dato.
- PRs: no cuentan carreras con tramos suspendidos ni sin tiempo total.

Hooks que escriben (no son queries; cada función es `async` y tira `Error` si
falla; la pantalla muestra su propio texto, no `error.message`):

| Hook | Funciones |
|---|---|
| `useWeekActions()` | `accept(weekId)`, `requestChanges(weekId, feedback)` |
| `useCheckin()` | `submit(input: CheckinInput)`, `submitVoice(input: VoiceCheckinInput)` (sube el audio una vez) |
| `useRaceActions()` | `markRegistered(id)`, `setMedal(id, localUri)`, `saveManualResult(id, result: RaceResult)` |

Después de escribir, los hooks de lectura se refrescan solos.

La app nunca escribe la prescripción de una sesión ni crea carreras: eso lo
hace el coach.

# Planos de pantallas

Cada archivo de esta carpeta es el plano de una pantalla. Se construye
**exactamente** lo que dice el plano: si algo es ambiguo o falta, se pregunta
en el PR, no se improvisa. Las reglas generales (rutas prohibidas, idioma,
colores, checks) están en [`AGENTS.md`](../../AGENTS.md); los datos, en
[`docs/contratos.md`](../contratos.md).

| Archivo | Pantalla |
|---|---|
| [hoy.md](hoy.md) | Pestaña Hoy |
| [sesion.md](sesion.md) | Detalle de una sesión |
| [checkin.md](checkin.md) | Hoja de check-in |
| [semana.md](semana.md) | Pestaña Semana |
| [carreras.md](carreras.md) | Pestaña Carreras (temporada) |
| [carrera.md](carrera.md) | Detalle de carrera, pestaña Perfil y modo día de carrera |
| [trofeos.md](trofeos.md) | Pestaña Trofeos |
| [trofeo.md](trofeo.md) | Detalle de trofeo |

## Orden de construcción

Cada paso es un PR (rama `codex/<paso>`). No se arranca el siguiente sin el
anterior mergeado.

1. **`codex/base`** — navegación nueva (abajo), `expo/utils/format.ts` y los
   componentes compartidos de la tabla. Sin pantallas todavía, salvo las
   cuatro pestañas con un `<EmptyState>` provisorio.
2. **`codex/hoy`** — [hoy.md](hoy.md) + [checkin.md](checkin.md).
3. **`codex/sesion`** — [sesion.md](sesion.md).
4. **`codex/semana`** — [semana.md](semana.md).
5. **`codex/trofeos`** — [trofeos.md](trofeos.md) + [trofeo.md](trofeo.md).
6. **`codex/carreras`** — [carreras.md](carreras.md) + [carrera.md](carrera.md).
7. **`codex/limpieza`** — borrar lo viejo (ver "Qué se va").

## Dependencias

Todo lo que piden los planos ya está en `expo/package.json`; no se agrega
nada. Las nativas que se sumaron para estos planos (y que por eso
necesitaron una **build nueva** de iOS, ya hecha):

- `expo-sensors` — `DeviceMotion` para `MedalTilt`. Permiso
  `NSMotionUsageDescription` configurado en `app.json`.
- `expo-keep-awake` — pantalla siempre prendida en el modo día de carrera.

Ya estaban: `react-native-svg` (altimetría, `SplitBar`), `expo-linear-gradient`
(brillo de la medalla), `expo-image-picker` (cambiar medalla),
`expo-web-browser` (Strava y web de la carrera), `expo-haptics`,
`@react-native-async-storage/async-storage` (tildes de logística) y
`lucide-react-native` (íconos).

**Ojo con las OTA:** un binario anterior a esta build no tiene el módulo
nativo de `expo-sensors`, y `runtimeVersion` no cambió. Una OTA que importe
`expo-sensors` rompe la app en ese binario. Antes de publicar por OTA la
pestaña Trofeos, el teléfono tiene que tener instalada la build de TestFlight
que trae `expo-sensors`.

## Navegación final

Pestañas, en este orden: **Hoy · Semana · Carreras · Trofeos**. Ajustes no es
pestaña: se abre con un engranaje arriba a la derecha de cada pestaña.

```
expo/app/
  _layout.tsx              Stack raíz (ya existe; agregar las rutas nuevas)
  (tabs)/
    _layout.tsx            4 pestañas (reemplaza el actual)
    hoy/index.tsx
    semana/index.tsx
    carreras/index.tsx
    trofeos/index.tsx
  sesion/[id].tsx          push, header propio
  checkin.tsx              presentation: 'formSheet' (hoja inferior)
  carrera/[id].tsx         push
  trofeo/[id].tsx          push
  ajustes.tsx              ya existe, no se toca (modal)
  account.tsx, login.tsx   ya existen, no se tocan
```

Pestañas (`(tabs)/_layout.tsx`), mismos estilos que el layout actual
(`tabBar`, `tabBarBorder`, etiqueta 11/600, activo `Colors.accent`, inactivo
`Colors.textTertiary`). Íconos de `lucide-react-native`:

| Ruta | Título | Ícono |
|---|---|---|
| `hoy` | Hoy | `Sun` |
| `semana` | Semana | `CalendarDays` |
| `carreras` | Carreras | `Flag` |
| `trofeos` | Trofeos | `Trophy` |

Cambios de enrutamiento obligatorios:

- `app/_layout.tsx`: donde hoy hace `router.replace('/(tabs)/(home)')`,
  pasa a `router.replace('/(tabs)/hoy')`. Registrar `sesion/[id]`,
  `checkin` (`presentation: 'formSheet'`, `sheetAllowedDetents: [0.75, 1]`,
  `sheetGrabberVisible: true`), `carrera/[id]` y `trofeo/[id]` con
  `headerShown: false`.
- `app/+native-intent.tsx`: los deep links de C1 tienen que llegar también en
  arranque en frío. Queda así: `oauth` → `/ajustes`; cualquier otro path se
  devuelve tal cual (sacar el `if (initial) return '/'`). `tritrack://hoy` →
  `/hoy`, `tritrack://semana` → `/semana`, `tritrack://checkin?session=…` →
  `/checkin?session=…`, `tritrack://carrera/<id>` → `/carrera/<id>`,
  `tritrack://trofeo/<id>` → `/trofeo/<id>`. Un path desconocido cae en
  `+not-found`, que tiene que ofrecer "Ir a Hoy".

### Qué se va (y qué pasa con History y Profile)

- **History se va.** Lo útil que tenía (ver semanas pasadas y qué se hizo)
  vive ahora en **Semana**: flechas para ir a semanas anteriores y la lista
  "Semanas anteriores" con su briefing (`useWeekHistory`).
- **Profile se va.** Lo que tenía de cuenta y conexiones ya está en Ajustes;
  las metas y el evento viejo los reemplazan Carreras y la cuenta regresiva de
  Hoy.
- **La pestaña Settings vieja se va.** Su contenido útil ya está en
  `ajustes.tsx` (que se queda).
- **La pestaña Train / `(home)` se va**, reemplazada por Hoy.

En `codex/limpieza` se borran: `app/(tabs)/(home)/`, `history/`, `profile/`,
`settings/` y los componentes que solo usaban ellas (`AddWorkoutModal`,
`EditWorkoutModal`, `WorkoutCard`, `WeeklySummaryModal`, `ProgressBottomSheet`,
`RecoveryModal`, `CalendarPickerModal`, `TimePickerModal`, `WeekCalendar`).
Antes de borrar uno, `grep` que nadie más lo importe. **No** se borran
`providers/` ni `utils/notifications.ts` ni `utils/integrations.ts` (los usan
Ajustes y el arranque); si `TrainingProvider` queda sin uso, se deja igual y se
anota en el PR.

## Encabezado común de pestaña

Todas las pestañas arrancan igual (dentro de `SafeAreaView`, fondo
`Colors.background`):

```
┌──────────────────────────────────────────────┐
│ ETIQUETA                               (⚙)   │  etiqueta 12/700, textSecondary,
│ Título grande                                │    mayúsculas, letterSpacing 1.5
└──────────────────────────────────────────────┘  título 28/800 textPrimary
```

- Padding horizontal 20, arriba 8, abajo 16.
- El engranaje es `<GearButton />` (componente compartido).
- Todo el contenido va en un `ScrollView` con `RefreshControl`
  (`tintColor={Colors.accent}`) que llama `refetch()` de los hooks de la
  pantalla.

## Estados comunes (todas las pantallas)

Con cualquier hook de lectura (`{ data, isLoading, error, refetch }`):

| Condición | Se muestra |
|---|---|
| `isLoading && !data` | `<Skeleton>` con la forma de la pantalla (no un spinner suelto) |
| `error && !data` | `<ErrorState onRetry={refetch} />` |
| `error && data` | El contenido normal con `<OfflineBanner />` arriba |
| `data` | El contenido |

Textos de `ErrorState`: título **"No pudimos cargar esto"**, cuerpo **"Revisá
la conexión y probá de nuevo."**, botón **"Reintentar"**.

Texto de `OfflineBanner`: **"Sin conexión · estás viendo lo último que se
cargó"**.

Nunca se muestra `error.message` al usuario.

## Formato (`expo/utils/format.ts`, nuevo)

Funciones puras, todas devuelven `string`. Las que reciben `null` devuelven
`'sin dato'`.

| Función | Ejemplo |
|---|---|
| `fmtDate(d: string)` | `'2026-10-14'` → `'mié 14 oct'` |
| `fmtDateLong(d: string)` | → `'miércoles 14 de octubre'` |
| `fmtDuration(s: number \| null)` | usa `formatDuration` de `@/data/calc/races`; `null` → `'sin dato'` |
| `fmtMinutes(min: number)` | `45` → `'45 min'`, `90` → `'1 h 30'` |
| `fmtDistance(m: number \| null, d: Discipline)` | nado `'2050 m'`; bici/trote `'7,1 km'` (coma decimal) |
| `fmtPace(sPerKm: number \| null)` | `341` → `'5:41 /km'` |
| `fmtSwimPace(moving_s, distance_m)` | → `'2:09 /100 m'` |
| `fmtStartTime(t: string \| null)` | `'07:30:00'` → `'7:30'` |
| `disciplineName(d)` | swim Nado · bike Bici · run Trote · brick Combinado · gym Gimnasio · rest Descanso |
| `raceKindName(k)` | run_5k 5K · run_10k 10K · run_21k Media maratón · run_42k Maratón · tri_sprint Triatlón sprint · tri_olympic Triatlón olímpico · tri_703 Medio Ironman · tri_full Ironman · other Carrera |
| `daysToText(n)` | 0 → `'Es hoy'`, 1 → `'Mañana'`, n → `'Faltan n días'` |

Fechas: siempre con `@/data/calc/dates` (`todayLocal`, `addDays`,
`mondayOf`). Nunca `new Date('AAAA-MM-DD')` para mostrar un día.

## Colores por cosa

Todos de `@/constants/colors`:

| Cosa | Color |
|---|---|
| Nado | `Colors.swim` (fondo suave `Colors.swimDark`) |
| Bici | `Colors.bike` / `Colors.bikeDark` |
| Trote | `Colors.run` / `Colors.runDark` |
| Combinado (brick) | `Colors.bike` (con un segundo punto `Colors.run`) |
| Gimnasio | `Colors.supplement` / `Colors.supplementDark` |
| Descanso | `Colors.textTertiary` |
| Recuperación verde / amarillo / rojo | `Colors.success` / `Colors.warning` / `Colors.danger` |
| Hecho | `Colors.success` |
| Acción principal | `Colors.accent` |
| Estimado | `Colors.warning` |

## Componentes compartidos (crear primero, en `expo/components/`)

Cada uno en su archivo, `React.memo`, estilos con `StyleSheet.create`, sin
lógica de datos (reciben props; no llaman hooks de `@/data`).

### `GearButton`
`{ }` → ícono `Settings` 20 px `Colors.textSecondary` en un círculo 36×36
`Colors.backgroundCard`; `router.push('/ajustes')`. `accessibilityLabel="Ajustes"`.

### `DisciplineDot`
`{ discipline: Discipline; size?: number /* 10 */ }` → círculo del color de la
disciplina. Para `brick`, dos medios círculos (bici arriba, trote abajo).

### `HrCapBadge`
`{ hrCap?: number; size?: 'lg' | 'sm'; color?: string }`
- `lg`: número 34/800 `textPrimary` + debajo `'techo'` 11/700 mayúsculas
  `textSecondary`. Es el número dominante de la tarjeta de sesión.
- `sm`: `'≤ 150'` 13/700 en una píldora con fondo `color + '20'`.
- Sin `hrCap`: no renderiza nada.

### `SessionCard`
`{ session: SessionView; onPress: () => void; onCheckin?: () => void; compact?: boolean }`

```
┌ GlassCard accentColor=<color disciplina> ───────────────┐
│ ● NADO · AM                               ┌────────┐    │  fila 1: DisciplineDot +
│ Nado continuo                             │  150   │    │    "NADO · AM" 11/700
│ 45 min · 2000 m                           │ techo  │    │  título 17/700
│                                           └────────┘    │  resumen 13/500 textSecondary
│ ─────────────────────────────────────────────────────── │  HrCapBadge lg a la derecha
│ ✓ Hecho  2050 m · 44:10 · FC 138           [¿Cómo te fue?]│  (solo si status done)
└─────────────────────────────────────────────────────────┘
```

- Resumen: `fmtMinutes(dur_min)` y `fmtDistance(distance_m)` separados por
  " · "; si es gimnasio, `'<n> ejercicios'`; si falta todo, no se muestra la
  línea.
- `optional`: agregar la etiqueta "opcional" 11/600 `textTertiary` al lado
  del título.
- `status === 'done'`: línea inferior con `Check` `Colors.success` +
  "Hecho" y, si hay `actual`, distancia · tiempo (`fmtDuration(moving_s)`) ·
  `FC <avg_hr>`. Si `!session.checkin && onCheckin` → botón chico
  "¿Cómo te fue?" (`Colors.accent`, fondo `accent + '20'`, radio 10). Si hay
  check-in → `'RPE <rpe> · energía <energia>/5'` 12/600 `textSecondary`.
- `status === 'skipped'`: toda la tarjeta con opacidad 0.5 y la etiqueta
  "Salteada".
- `compact`: sin línea inferior y sin HrCapBadge lg (usa `sm`). Es la versión
  de la lista de Semana.

### `RecoveryCard`
`{ recovery: Recovery | null; today: string }` → ver [hoy.md](hoy.md).

### `StatusBanner`
`{ tone: 'info' | 'warning'; title: string; body?: string; actionLabel?: string; onAction?: () => void }`
Tarjeta con borde izquierdo 3 px (`accent` para info, `warning` para
warning), título 15/700, cuerpo 13/500 `textSecondary`, acción como texto
14/700 del color del tono.

### `OfflineBanner`
`{ }` → píldora 12/600 `Colors.warning` sobre `warning + '15'`, ícono
`WifiOff` 14 px, texto fijo (ver Estados comunes).

### `EmptyState` / `ErrorState`
`EmptyState { icon: LucideIcon; title: string; body?: string; actionLabel?: string; onAction?: () => void }`
centrado, ícono 32 px `textTertiary`, título 17/700, cuerpo 14/500
`textSecondary`, botón primario opcional.
`ErrorState { onRetry: () => void }` = EmptyState con `CloudOff` y los textos
fijos de arriba.

### `Skeleton`
`{ height: number; width?: number | string; radius?: number }` → bloque
`Colors.backgroundCardHover` con opacidad que late (Animated, 0.4 ↔ 0.8,
900 ms). Cada pantalla compone los suyos.

### `PrimaryButton` / `SecondaryButton`
`{ label: string; onPress: () => void; loading?: boolean; disabled?: boolean }`
Alto 50, radio 14, texto 16/700. Primario: fondo `Colors.accent`, texto
blanco. Secundario: fondo `backgroundCard`, borde `cardBorderLight`, texto
`textPrimary`. Con `loading`, `ActivityIndicator` en vez del texto y sin
toques. Haptic `Light` al tocar.

### `BottomSheet`
`{ visible: boolean; onClose: () => void; title: string; children }` →
`Modal` transparente, fondo `rgba(0,0,0,0.6)`, hoja `Colors.backgroundLight`
radio 24 arriba, manija 36×4, título 17/700. Cierra tocando afuera.
(La hoja de check-in NO usa esto: es una ruta `formSheet`).

### `MarkdownText`
`{ md: string; size?: number /* 15 */ }` → markdown mínimo, sin dependencias:
párrafos (línea en blanco), viñetas (`- `), negrita (`**x**`), títulos
(`#`/`##` → 17/700). Todo lo demás se muestra como texto plano.

### `FieldValue`
`{ label: string; display: FieldDisplay /* de @/data/calc/profile */ }` →
fila con etiqueta 13/500 `textSecondary` a la izquierda y valor 15/600 a la
derecha. Si `display.missing` → valor `'sin dato'` en `textTertiary`. Si
`display.estimated` → valor + píldora `'estimado'` 10/700 `Colors.warning`.
Si hay `note` en el campo, va debajo en 12/500 `textTertiary`.

### `SplitBar`
`{ result: RaceResult }` → barra horizontal alto 14, radio 7, con un tramo
por segmento (nado, T1, bici, T2, trote) proporcional a su tiempo.
- Colores: nado `swim`, bici `bike`, trote `run`, transiciones
  `textTertiary`.
- Tramo suspendido (`segmentState === 'suspendido'`): ancho fijo 12 %, rayado
  (franjas diagonales con `react-native-svg`) en el color del tramo al 30 %.
- Tramo `sin_dato`: no ocupa espacio.
- Debajo, leyenda: `● Nado 28:15` / `● Nado suspendido` / `● Nado sin dato`
  12/600.

### `MedalTilt`
`{ uri: string | null; size?: number /* 220 */; kind: RaceKind }` → la
medalla que se inclina con el teléfono.
- `DeviceMotion` de `expo-sensors` (ya instalado), `setUpdateInterval(16)`.
  `rotation.beta` → `rotateX`, `rotation.gamma` → `rotateY`, cada uno
  limitado a ±18°, con `perspective: 800`. Usar `Animated` con un resorte
  corto para suavizar.
- Brillo: un `LinearGradient` (`expo-linear-gradient`) blanco 0 → 0.35 → 0 que
  se desplaza en X según `gamma`.
- Sin `uri`: un disco con `LinearGradient` dorado (`#F5D06F` → `#B8860B`) y
  `raceKindName(kind)` en el centro 15/800.
- Si `DeviceMotion.isAvailableAsync()` es false (web, simulador): queda
  quieta y se puede arrastrar con el dedo (PanResponder) con los mismos
  límites.
- Suscribirse en `useEffect` y desuscribirse al desmontar o cuando la
  pantalla pierde foco (`useFocusEffect`).

### `ElevationChart`
`{ points: [number, number][]; color: string; height?: number /* 120 */ }` →
área con `react-native-svg`: eje X km, eje Y altura. Línea 2 px del color,
relleno del color al 15 %. Etiquetas: altura mínima y máxima a la izquierda
(11/600 `textTertiary`), `'0 km'` y `'<max> km'` abajo.

### `ClimateBand`
`{ row: ClimateRow; label: string }` → una fila por tramo:

```
NADO · 7:00                      14 °C   (sensación máx 18 °C)
├───────[████●████]──────────┤  9 ──────────── 18
Llovió 2 de 10 años
```
Barra de rango min–max sobre una escala fija 0–40 °C, punto en la mediana.
Color de la barra: < 15 °C `swim`, 15–25 °C `success`, 25–30 °C `warning`,
> 30 °C `danger`.

### `ScaleSelector`
`{ values: number[]; value: number | null; onChange: (n) => void; labels?: Record<number, string>; color?: string }`
→ fila de botones cuadrados 40×40 radio 10 (se reparten el ancho). El
elegido, fondo `color` y texto blanco; el resto `backgroundCard`. Haptic
`Selection` al cambiar. Debajo del primero y del último, `labels` en 11/600
`textTertiary`.

### `Countdown`
`{ days: number }` → número 34/800 + "días" 13/600; con 0 → "Hoy" 34/800
`Colors.accent`.

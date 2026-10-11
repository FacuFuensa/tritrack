# Carrera (detalle, Perfil y modo día de carrera)

## 1. Para qué existe

Todo lo de una carrera en un lugar: cuánto falta, la logística como lista de
pendientes, "Ya me inscribí", la estrategia del coach y, en la pestaña
**Perfil**, cómo es el recorrido (altimetría, agua, neopreno), qué clima suele
hacer a la hora de cada tramo y qué sesiones de la semana apuntan a esta
carrera. El día de la carrera se transforma en el **modo día de carrera**:
letra grande, lo esencial, y anda sin conexión con lo último cargado.

## 2. Ruta y cómo se llega

- Archivo: `expo/app/carrera/[id].tsx` (push, `headerShown: false`).
- Desde Carreras (tarjeta), Hoy (tarjeta de próxima carrera) y el deep link
  `tritrack://carrera/<race_id>`.
- Parámetro opcional `?modo=dia` para abrir directo en modo día de carrera.

## 3. Hooks

```ts
const { id, modo } = useLocalSearchParams<{ id: string; modo?: string }>();
const { data: race, isLoading, error, refetch } = useRace(id);
const { markRegistered } = useRaceActions();
const week = useWeek();                 // sesiones de esta semana, para "Cómo te estamos preparando"
const today = useToday();               // nextRace.id, para saber si es la próxima
```

| Elemento | Campo |
|---|---|
| Encabezado | `race.name`, `date`, `location`, `kind`, `priority`, `start_local` |
| Cuenta regresiva | `daysTo(race.date, todayLocal())` |
| Logística | `race.logistics` + `race.status` |
| Estrategia | `race.strategy_md` |
| Perfil | `race.profile` (con `fieldDisplay`) |
| Altimetría | `race.profile.bike.profile_points`, `race.profile.run.profile_points` |
| Clima | `race.climate.by_segment`, `race.climate.forecast`, `race.climate.updated_at` |
| Cómo te estamos preparando | `week.data.sessions` con `tags` `especifico` o `simulacro` (solo si `today.data.nextRace?.id === race.id`) |
| Resultado (si ya se corrió) | `race.result` → enlace a `/trofeo/<id>` |

## 4. Layout

### 4.1 Detalle (pestaña Resumen)

```
┌────────────────────────────────────────────────┐
│ ‹ Volver                                       │
│ TRIATLÓN OLÍMPICO · A                          │ 12/700 color de prioridad
│ Triatlón Olímpico Cerro Azul                   │ 28/800
│ sáb 4 nov · 7:30 · Cerro Azul                  │ 15/500 textSecondary
├────────────────────────────────────────────────┤
│ ┌ GlassCard accent=accent ────────────────────┐│
│ │        21                                   ││ Countdown grande (48/800)
│ │       días                                  ││
│ │ [   Modo día de carrera   ]                 ││ SecondaryButton (siempre en próximas)
│ └─────────────────────────────────────────────┘│
│ [ Resumen ][ Perfil ]                          │ selector segmentado, alto 36, radio 10,
├────────────────────────────────────────────────┤   activo fondo accent
│ LOGÍSTICA                                      │
│ ┌ GlassCard ──────────────────────────────────┐│
│ │ ✓ Inscripción          Inscripto            ││ fila checklist: círculo 22 (✓ success
│ │ ○ Inscripción          cierra el lun 19 oct ││   o vacío), título 15/600, detalle 13/500
│ │   [ Ya me inscribí ]                        ││ botón chico accent, solo si no inscripto
│ │ ○ Retiro de kit                             ││ retiro_kit en 13/500 debajo
│ │   El día anterior, 14 a 19 h…               ││
│ │ ○ Viaje                 2 h en auto         ││
│ │ ↗ Web de la carrera                         ││ link 15/600 accent (si url)
│ └─────────────────────────────────────────────┘│
│ ESTRATEGIA                                     │
│ ┌ GlassCard ──────────────────────────────────┐│
│ │ <MarkdownText strategy_md>                  ││
│ └─────────────────────────────────────────────┘│
│ ┌ GlassCard accent=success ───────────────────┐│ solo si ya se corrió (status done)
│ │ Ver resultado y medalla →                   ││
│ └─────────────────────────────────────────────┘│
└────────────────────────────────────────────────┘
```

Checklist: "Inscripción" toma el tilde de `status === 'registered' || 'done'`.
"Retiro de kit" y "Viaje" se pueden tildar a mano; esos tildes se guardan en
el teléfono con `AsyncStorage`, clave `logistica:<race_id>`, valor
`{ kit: boolean, viaje: boolean }`. Una fila cuyo dato no existe no va.

### 4.2 Pestaña Perfil

```
│ NADO                                           │ sección con DisciplineDot
│ ┌ GlassCard accent=swim ──────────────────────┐│
│ │ Distancia                         1500 m    ││ FieldValue por campo presente:
│ │ Agua                              Lago      ││   distance_m, water_type, salt (Sí/No),
│ │ Temperatura del agua   21 °C [estimado]     ││   temp_c, wetsuit, start_type,
│ │   Promedio de años anteriores               ││   course_shape
│ │ Neopreno                          Permitido ││
│ └─────────────────────────────────────────────┘│
│ BICI                                           │
│ ┌ GlassCard accent=bike ──────────────────────┐│
│ │ <ElevationChart profile_points color=bike>  ││ si hay puntos
│ │ Distancia 40 km · Desnivel 520 m            ││ FieldValue: distance_km, elev_gain_m,
│ │ Subidas clave                               ││   aid_stations, roads; key_climbs como
│ │ · Subida del mirador (km 12)                ││   viñetas
│ └─────────────────────────────────────────────┘│
│ TROTE                                          │ igual: distance_km, elev_gain_m, loops
│ ┌ GlassCard accent=run ───────────────────────┐│   ("2 vueltas"), surface, altimetría
│ └─────────────────────────────────────────────┘│
│ CLIMA A LA HORA DE CADA TRAMO                  │
│ ┌ GlassCard ──────────────────────────────────┐│
│ │ <ClimateBand> por cada fila de by_segment   ││ label: NADO · 7:00 / BICI · 8:00 /
│ │                                             ││   TROTE · 10:00 / CARRERA · 9:00
│ │ Pronóstico (si forecast)                    ││ 26 °C · sensación 28 · viento 14 km/h
│ │                                             ││   · lluvia 20 %
│ │ Histórico de 10 años · actualizado mié 13   ││ 11/500 textTertiary
│ └─────────────────────────────────────────────┘│
│ CÓMO TE ESTAMOS PREPARANDO                     │ solo si es la próxima carrera
│ ┌ SessionCard compact ────────────────────────┐│ sesiones de esta semana con tag
│ └─────────────────────────────────────────────┘│   especifico o simulacro; debajo de
│   why en 13/500 textSecondary                  │   cada una, su `why`
```

Unidades de `FieldValue`: m, km, °C; `water_type`: mar **Mar**, lago
**Lago**, rio **Río**, pileta **Pileta**; `salt`: **Sí** / **No**;
`loops`: **<n> vueltas** (1 → **1 vuelta**).

### 4.3 Modo día de carrera

Pantalla completa (mismo archivo, estado `raceDay`): fondo `Colors.background`,
sin tarjetas, padding 24, texto alineado a la izquierda, dentro de un
`ScrollView`:

```
┌────────────────────────────────────────────────┐
│ ✕                                              │ cerrar 28 px arriba a la izquierda
│ TRIATLÓN OLÍMPICO CERRO AZUL                   │ 15/800 textSecondary
│ Largada 7:30                                   │ 44/800 textPrimary
│ Faltan 2 h 15                                  │ 28/700 accent (se actualiza cada minuto)
│                                                │
│ 14 °C → 22 °C                                  │ 34/800; mediana nado → mediana trote
│ sensación máx 29 · lluvia 1 de 10 años         │ 17/600 textSecondary
│ (o el pronóstico si existe)                    │
│                                                │
│ PLAN                                           │ 15/800 textSecondary
│ Nado: salir por afuera, ritmo parejo.          │ las primeras 5 viñetas de strategy_md,
│ Bici: cuestas sentado, sin pasar 165.          │   22/700, separadas 16
│ Trote: primeros 2 km contenidos.               │
│                                                │
│ Retiro de kit: el día anterior, 14 a 19 h…     │ 17/600 textSecondary (si no pasó)
└────────────────────────────────────────────────┘
```

- "Faltan …" usa `start_local`: antes de la hora, **"Faltan 2 h 15"**;
  menos de 1 h, **"Faltan 40 min"**; después de la hora, **"¡A correr!"**.
  Sin `start_local`, la línea no va.
- `useKeepAwake()` de `expo-keep-awake` (ya viene con Expo) mientras está
  abierto.
- Funciona sin conexión: usa los datos cacheados de `useRace`; si hay
  `error && race`, muestra arriba **"Sin conexión · datos guardados"**
  13/600 `Colors.warning`, nada más.

Se entra al modo día de carrera: con el botón "Modo día de carrera"; con
`?modo=dia`; y **automáticamente** si `daysTo === 0` (la primera vez que se
abre la carrera ese día; se puede salir con ✕).

## 5. Estados

| Estado | Qué se ve |
|---|---|
| Cargando | Volver + `Skeleton` 30, 20, 140, 36, 200 |
| Error sin datos | Volver + `ErrorState` |
| Sin conexión con datos | `OfflineBanner` debajo de Volver (en modo día, el aviso de arriba) |
| `race === null` | `EmptyState` `SearchX` **"No encontramos esta carrera"**, acción **"Ir a Carreras"** → `router.replace('/carreras')` |
| Carrera pasada | Sin cuenta regresiva ni botón de modo día; etiqueta **"CORRIDA"**; si `status === 'done'`, la tarjeta "Ver resultado y medalla →" |
| `status === 'dns'` | Etiqueta **"NO LARGUÉ"**, sin resultado |
| `strategy_md` null | Sección ESTRATEGIA con **"El coach todavía no escribió la estrategia."** 14/500 `textSecondary` |
| `logistics` vacío y no inscripto | Logística solo con la fila Inscripción |
| `profile` vacío | Perfil: `EmptyState` **"Todavía no hay datos del recorrido"** |
| Un segmento sin campos | Ese segmento no va |
| `Field.value` null | `FieldValue` con **"sin dato"** |
| `Field.source === 'estimado'` | El valor con la píldora **"estimado"** |
| `climate` null | Sección clima con **"Todavía no hay datos de clima."** |
| Sin sesiones específicas | **"Esta semana no hay sesiones específicas para esta carrera."** |
| No es la próxima carrera | La sección "Cómo te estamos preparando" no va |
| `markRegistered` falla | Debajo del botón, **"No se pudo guardar. Probá de nuevo."** `Colors.danger` |

## 6. Interacciones

| Toque | Hace |
|---|---|
| Volver | `router.back()` |
| Resumen / Perfil | Cambia de pestaña (estado local; recuerda la última en la sesión) |
| **Ya me inscribí** | `await markRegistered(race.id)`; botón con `loading`; éxito → haptic `Success`, la fila queda tildada con "Inscripto" |
| Círculo de Retiro de kit / Viaje | Tilda o destilda y guarda en `AsyncStorage` |
| Web de la carrera | `WebBrowser.openBrowserAsync(url)` |
| Modo día de carrera | Entra al modo (4.3) |
| ✕ en modo día | Sale al detalle |
| Ver resultado y medalla | `router.push('/trofeo/' + race.id)` |
| `SessionCard` en "Cómo te estamos preparando" | `/sesion/<id>` |
| Tirar hacia abajo | `refetch()` (no en modo día) |

## 7. Textos exactos

**Volver** · **días** · **Hoy** · **Modo día de carrera** · **Resumen** ·
**Perfil** · **LOGÍSTICA** · **Inscripción** · **Inscripto** · **cierra el
<fmtDate>** · **Ya me inscribí** · **Retiro de kit** · **Viaje** · **Web de la
carrera** · **ESTRATEGIA** · **Ver resultado y medalla →** · **NADO** ·
**BICI** · **TROTE** · **Distancia** · **Agua** · **Agua salada** ·
**Temperatura del agua** · **Neopreno** · **Largada** (start_type) ·
**Recorrido** (course_shape) · **Desnivel** · **Subidas clave** ·
**Puestos de hidratación** · **Calles** · **Vueltas** · **Superficie** ·
**CLIMA A LA HORA DE CADA TRAMO** · **Pronóstico** · **sensación** ·
**viento** · **lluvia** · **Histórico de <years> años · actualizado
<fmtDate>** · **Llovió <rain_years> de <years> años** · **CÓMO TE ESTAMOS
PREPARANDO** · **estimado** · **sin dato** · **Largada <hora>** · **Faltan
<…>** · **¡A correr!** · **PLAN** · **Sin conexión · datos guardados** ·
**CORRIDA** · **NO LARGUÉ** · y los textos de vacío y error de la tabla.

## 8. Checklist de aceptación

- [ ] Cerro Azul (mock): 21 días, logística con Inscripción tildada, retiro
      de kit y viaje tildables (y el tilde sobrevive a cerrar la app), web,
      estrategia en viñetas.
- [ ] Río Claro: "Ya me inscribí" funciona y la fila queda tildada.
- [ ] Perfil de Cerro Azul: altimetría de bici y trote, temperatura del agua
      con "estimado" y su nota, 3 bandas de clima.
- [ ] Perfil de Río Claro: temperatura del agua **"sin dato"**, pronóstico
      visible.
- [ ] "Cómo te estamos preparando" en Cerro Azul muestra "Cuestas cortas" y
      "Bici + trote" con su para qué.
- [ ] Modo día de carrera: letra grande, sin tarjetas, pantalla no se apaga,
      y en modo avión sigue mostrando todo.
- [ ] Una carrera pasada no tiene cuenta regresiva y enlaza al trofeo.
- [ ] Capturas: resumen, perfil, modo día, sin conexión, carrera pasada.

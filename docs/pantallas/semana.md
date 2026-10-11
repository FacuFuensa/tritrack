# Semana

## 1. Para qué existe

Ver la semana entera: qué toca cada día, cuánto se planeó y cuánto se hizo por
disciplina, y cuánto del tiempo quedó en zona 2. El domingo es donde se lee el
briefing del coach y se acepta la semana o se piden cambios. También es el
historial: se puede ir a semanas anteriores y leer sus briefings (lo que antes
estaba en History).

## 2. Ruta y cómo se llega

- Archivo: `expo/app/(tabs)/semana/index.tsx`. Segunda pestaña ("Semana",
  ícono `CalendarDays`).
- Deep link: `tritrack://semana` (lo trae la notificación **"Tu semana está
  lista"**), y "Ver la semana" del banner de Hoy.
- Parámetro opcional `?lunes=AAAA-MM-DD` para abrir una semana puntual.

## 3. Hooks

```ts
const [monday, setMonday] = useState(params.lunes ?? mondayOf(todayLocal()));
const week = useWeek(monday);
const history = useWeekHistory();
const { accept, requestChanges } = useWeekActions();
```

| Elemento | Campo |
|---|---|
| Encabezado (semana N, foco) | `week.data.week` (`week_index`, `focus`, `kind`, `block_name`) |
| Tira de días | `week.data.sessions` agrupadas por `date` |
| Tarjeta de propuesta | `week.data.week.status`, `.briefing_md`, `.feedback` |
| Volumen | `week.data.volume` |
| % en Z2 | `week.data.z2Pct` |
| Resumen de cumplimiento | `week.data.week.sessions_done` / `sessions_planned`, `minutes_planned` |
| Lista de sesiones | `week.data.sessions` |
| Semanas anteriores | `history.data` |

## 4. Layout

```
┌────────────────────────────────────────────────┐
│ SEMANA 6 · CONSTRUCCIÓN                  (⚙)   │ etiqueta: "SEMANA <week_index> · <kind>"
│ Cuestas y nado continuo                        │ título = focus (28/800)
│ Base hacia el olímpico                         │ block_name 13/600 textSecondary
├────────────────────────────────────────────────┤
│ ‹   12 – 18 oct                        Hoy  ›  │ navegación: flechas 28×28, rango 15/700
├────────────────────────────────────────────────┤   "Hoy" píldora accent (solo si no es la actual)
│ [L 12][M 13][X 14][J 15][V 16][S 17][D 18]     │ WeekStrip (abajo)
│   ●●    ●     ●●    ●            ●●   ●        │   puntos de disciplina por día
├────────────────────────────────────────────────┤
│ ┌ GlassCard accent=accent (PROPUESTA) ────────┐│ solo si status proposed
│ │ PROPUESTA DEL COACH                         ││ 11/700 accent
│ │ <MarkdownText briefing_md>                  ││ máx 6 líneas plegado
│ │ Leer todo ▾                                 ││ 14/600 accent
│ │ [ Aceptar ]        [ Pedir cambios ]        ││ Primary + Secondary, mitad y mitad
│ └─────────────────────────────────────────────┘│
│   (o tarjeta de briefing aceptado / cambios)   │
├────────────────────────────────────────────────┤
│ ┌ GlassCard ──────────────────────────────────┐│
│ │ VOLUMEN                      Z2  100 %      ││ "Z2" 11/700 + valor 17/800 success
│ │ ● Nado    2050 / 2000 m     ███████████ 102%││ una fila por VolumeRow:
│ │ ● Bici    0 / 32 km         ░░░░░░░░░░░   0%││   punto, nombre 14/600, "hecho / plan unidad"
│ │ ● Trote   7,1 / 33 km       ██░░░░░░░░░  22%││   13/600, barra alto 6 radio 3 del color,
│ │ ● Combinado 0 / 1 ses       ░░░░░░░░░░░   0%││   fondo color al 15 %
│ │ ● Gimnasio  0 / 2 ses       ░░░░░░░░░░░   0%││ barra se corta en 100 %; el % puede pasar
│ │ ─────────────────────────────────────────── ││
│ │ 2 de 8 sesiones · 8 h 35 planeadas          ││ 13/600 textSecondary
│ └─────────────────────────────────────────────┘│
├────────────────────────────────────────────────┤
│ LUNES 12                                       │ cabecera por día con sesiones,
│ ┌ SessionCard compact ────────────────────────┐│   12/700 mayúsculas textSecondary;
│ └─────────────────────────────────────────────┘│   la de hoy en Colors.accent con " · HOY"
│ MIÉRCOLES 14 · HOY                             │
│ ┌ SessionCard compact ────────────────────────┐│
│ └─────────────────────────────────────────────┘│
├────────────────────────────────────────────────┤
│ SEMANAS ANTERIORES                             │ solo con la semana actual en pantalla
│ ┌ GlassCard ──────────────────────────────────┐│ una por semana de history.data:
│ │ Semana 5 · 5 – 11 oct              1 de 2 ✓ ││   título 15/700, cumplimiento 13/700 success
│ │ Volumen aeróbico                            ││   focus 13/500 textSecondary
│ │ Semana sólida: cumpliste 6 de 7.            ││   primera línea del briefing, 13/500,
│ └─────────────────────────────────────────────┘│   1 línea con "…"
└────────────────────────────────────────────────┘
```

**`WeekStrip`** (componente nuevo de esta pantalla, en `expo/components/`):
mismo aspecto que el `WeekCalendar` viejo (celdas 38 de ancho, radio 12,
nombre del día 11/600 arriba, número 17/600, seleccionado fondo `accent`,
hoy con borde `accent + '50'`), pero con props
`{ monday: string; selected: string | null; today: string; dots: Record<string, Discipline[]>; onSelect: (date: string) => void }`
y, debajo del número, hasta 3 `DisciplineDot` de 5 px (los de las sesiones
de ese día; una sesión `done` va con opacidad 1, el resto 0.4). Nombres de
día: **L M X J V S D**.

`kind` en la etiqueta: reset **DESCARGA** · build **CONSTRUCCIÓN** · peak
**PICO** · absorb **ASIMILACIÓN** · taper **AFINADO** · race **CARRERA**.

## 5. Estados

| Estado | Qué se ve |
|---|---|
| Cargando | Encabezado con `Skeleton`, la navegación real, `Skeleton` 70 (tira), 160 y 3×80 |
| Error sin datos | Navegación + `ErrorState` |
| Sin conexión con datos | `OfflineBanner` debajo del encabezado |
| `week === null` y sin sesiones | Etiqueta **"SEMANA"**, título = el rango (`12 – 18 oct`); en lugar de tarjetas, `EmptyState` `CalendarX` **"No hay plan para esta semana"**; si es la semana actual o futura, cuerpo **"Si es domingo, el coach todavía no la escribió."** |
| `status === 'proposed'` | Tarjeta "PROPUESTA DEL COACH" con Aceptar / Pedir cambios. Las sesiones se ven igual |
| `status === 'accepted'` | Tarjeta "BRIEFING" (sin botones), plegada a 3 líneas con "Leer todo ▾"; si `briefing_md` es null, no va |
| `status === 'changes_requested'` | Tarjeta con borde `warning`: **"PEDISTE CAMBIOS"**, la cita del `feedback` en itálica, y **"El coach va a rehacer la semana."** Sin botones |
| `z2Pct === null` | **"Z2 sin dato"** 13/600 `textTertiary` |
| `volume` vacío | La tarjeta de volumen muestra solo la línea de cumplimiento |
| Día sin sesiones | No tiene cabecera en la lista |
| `history.data` vacío | La sección "SEMANAS ANTERIORES" no va |
| `history` con error | La sección no va (no tapa el resto) |

## 6. Interacciones

| Toque | Hace |
|---|---|
| `‹` / `›` | `setMonday(addDays(monday, ∓7))`; haptic `Light` |
| "Hoy" | Vuelve a `mondayOf(todayLocal())` |
| Un día de la tira | Hace scroll hasta la cabecera de ese día (si no tiene sesiones, no hace nada) |
| `SessionCard` | `/sesion/<id>` |
| "Leer todo ▾" | Despliega el briefing completo; cambia a **"Leer menos ▴"** |
| **Aceptar** | `await accept(week.id)`; botón con `loading`; al terminar, haptic `Success` y la tarjeta pasa a "BRIEFING". Error → texto rojo debajo: **"No se pudo aceptar. Probá de nuevo."** |
| **Pedir cambios** | Abre `BottomSheet` "Pedir cambios" con `TextInput` multilínea (placeholder **"Qué querés que cambie: días, volumen, una sesión…"**, mínimo 5 caracteres) y `PrimaryButton` **"Mandar"** → `await requestChanges(week.id, texto)`, cierra la hoja. Error → **"No se pudo mandar. Probá de nuevo."** dentro de la hoja |
| Tarjeta de semana anterior | `setMonday(w.monday)` y scroll arriba |
| Tirar hacia abajo | `week.refetch()` y `history.refetch()` |

## 7. Textos exactos

**SEMANA <n> · <TIPO>** · **SEMANA** · **Hoy** · **L M X J V S D** ·
**PROPUESTA DEL COACH** · **BRIEFING** · **PEDISTE CAMBIOS** · **El coach va a
rehacer la semana.** · **Leer todo ▾** · **Leer menos ▴** · **Aceptar** ·
**Pedir cambios** · **Mandar** · placeholder de arriba · **VOLUMEN** · **Z2** ·
**Z2 sin dato** · **<hechas> de <planeadas> sesiones · <fmtMinutes> planeadas** ·
nombres de disciplina de `disciplineName` · unidades **m**, **km**, **ses** ·
**<DÍA> <n>** y **· HOY** · **SEMANAS ANTERIORES** · **Semana <n> · <rango>** ·
**<hechas> de <planeadas> ✓** · **No hay plan para esta semana** · **Si es
domingo, el coach todavía no la escribió.** · errores de arriba.

Rango: `12 – 18 oct`; si cruza de mes, `28 sep – 4 oct`.

## 8. Checklist de aceptación

- [ ] En mock se ve "SEMANA 6 · CONSTRUCCIÓN", la propuesta con Aceptar y
      Pedir cambios, volumen con nado 2050 / 2000 m y Z2 100 %.
- [ ] Aceptar cambia la tarjeta a "BRIEFING" y el banner de Hoy desaparece.
- [ ] Pedir cambios con texto deja la tarjeta "PEDISTE CAMBIOS" con la cita.
- [ ] `‹` lleva a la semana 5 (aceptada, 1 de 2 hechas, la otra "Salteada");
      `‹` otra vez muestra "No hay plan para esta semana".
- [ ] "SEMANAS ANTERIORES" lista la semana 5 y tocándola navega.
- [ ] Los puntos de la tira coinciden con las sesiones de cada día.
- [ ] Capturas: propuesta, aceptada, cambios pedidos, semana vacía, sin conexión.

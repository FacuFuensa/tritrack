# Carreras

## 1. Para qué existe

La temporada en una línea de tiempo: qué carreras vienen, cuánto falta, cuáles
son objetivo (A) y cuáles de paso, y cuáles ya se corrieron. Desde acá se
entra al detalle de cada una. Las carreras no se crean desde la app: las carga
el coach.

## 2. Ruta y cómo se llega

- Archivo: `expo/app/(tabs)/carreras/index.tsx`. Tercera pestaña
  ("Carreras", ícono `Flag`).
- Sin deep link propio (el detalle tiene `tritrack://carrera/<id>`).

## 3. Hooks

```ts
const { data, isLoading, error, refetch } = useRaces();   // { upcoming, past }
```

| Elemento | Campo |
|---|---|
| Lista "Próximas" | `data.upcoming` (la más cercana primero) |
| Lista "Corridas" | `data.past` (la última primero) |
| Cada fila | `name`, `date`, `location`, `kind`, `priority`, `status`, `result.total_s` |
| Días que faltan | `daysTo(race.date, todayLocal())` de `@/data/calc/races` |

## 4. Layout

```
┌────────────────────────────────────────────────┐
│ TEMPORADA                                (⚙)   │
│ Carreras                                       │
├────────────────────────────────────────────────┤
│ PRÓXIMAS                                       │ sección 12/700
│  │                                             │
│  ●─┬ GlassCard accent=<prioridad> ───────────┐ │ línea vertical 2 px cardBorderLight a la
│  │ │ SÁB 4 NOV · CERRO AZUL           21     │ │   izquierda (x=28), con un nodo de 12 px
│  │ │ Triatlón Olímpico Cerro Azul     días   │ │   del color de prioridad por carrera
│  │ │ Triatlón olímpico   [A] [Inscripto]     │ │ fecha · lugar 11/700 mayúsculas
│  │ └─────────────────────────────────────────┘ │ nombre 17/700, Countdown chico (22/800)
│  ●─┬ GlassCard ──────────────────────────────┐ │ píldoras: prioridad y estado
│  │ │ …                                       │ │
│  │                                             │
│ CORRIDAS                                       │
│  ○─┬ GlassCard (sin accent) ─────────────────┐ │ nodo hueco
│  │ │ 15 AGO · CIUDAD PUERTO                  │ │
│  │ │ 10K Nocturno                  sin dato  │ │ a la derecha fmtDuration(total_s)
│  │ │ 10K                                     │ │   17/800, o "sin dato" / "No largué"
│  │ └─────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

- La tarjeta dentro de la línea de tiempo: `marginLeft: 44`,
  `marginHorizontal` derecho 20.
- Color de prioridad: A `Colors.accent`, B `Colors.bike`, C
  `Colors.textSecondary`, null `Colors.cardBorderLight`.
- Píldora de prioridad: **A** / **B** / **C** 11/800 sobre el color al 20 %.
- Píldora de estado (solo próximas): planned **"Sin inscribir"**
  (`textSecondary`), registered **"Inscripto"** (`success`).
- Carreras pasadas con `status === 'dns'`: a la derecha **"No largué"**
  13/600 `textTertiary`, tarjeta con opacidad 0.6.
- Carrera pasada con algún tramo `cancelled`: debajo del tiempo, **"con
  tramo suspendido"** 11/600 `Colors.warning`.
- La fecha de las pasadas de otro año lleva el año: `15 AGO 2025`.

## 5. Estados

| Estado | Qué se ve |
|---|---|
| Cargando | Encabezado + 4 `Skeleton` de 96 con la línea de tiempo dibujada |
| Error sin datos | `ErrorState` |
| Sin conexión con datos | `OfflineBanner` |
| Sin carreras | `EmptyState` `Flag` **"Todavía no hay carreras"**, cuerpo **"Las carga el coach. Pedíselas por chat."** |
| `upcoming` vacío | La sección "PRÓXIMAS" muestra una línea **"No hay carreras por delante."** 14/500 `textSecondary` |
| `past` vacío | La sección "CORRIDAS" no va |
| `location` null | La etiqueta queda solo con la fecha |
| `total_s` null | **"sin dato"** (nunca `0:00`) |
| Carrera hoy | Countdown **"Hoy"** en `Colors.accent` y la tarjeta con borde `accent` 2 px |

## 6. Interacciones

| Toque | Hace |
|---|---|
| Tarjeta | `router.push('/carrera/' + id)` — también las pasadas |
| Tirar hacia abajo | `refetch()` |

Sin mutations.

## 7. Textos exactos

**TEMPORADA** · **Carreras** · **PRÓXIMAS** · **CORRIDAS** · **días** ·
**Hoy** · **A** **B** **C** · **Sin inscribir** · **Inscripto** · **No
largué** · **con tramo suspendido** · **sin dato** · **No hay carreras por
delante.** · **Todavía no hay carreras** · **Las carga el coach. Pedíselas
por chat.** · nombres de tipo de `raceKindName`.

## 8. Checklist de aceptación

- [ ] En mock: 2 próximas (Cerro Azul a 21 días "Inscripto" A; Río Claro
      "Sin inscribir" A) y 3 corridas, la última primero.
- [ ] "10K Nocturno" muestra "sin dato", no `0:00`.
- [ ] "Triatlón Bahía Serena" muestra su tiempo y "con tramo suspendido".
- [ ] La línea de tiempo es continua y cada nodo tiene el color de su
      prioridad.
- [ ] Tocar cualquier tarjeta abre su detalle.
- [ ] Capturas: lista, vacía, cargando.

# Hoy

## 1. Para qué existe

Es la pantalla que se abre todos los días. Dice qué toca entrenar hoy, con el
techo de pulso como número principal, cómo viene la recuperación y cuánto
falta para la próxima carrera. Cuando una sesión ya se hizo, muestra lo real y
pide el check-in. Nunca queda vacía: si la semana no llegó, lo dice y deja
entrenar igual.

## 2. Ruta y cómo se llega

- Archivo: `expo/app/(tabs)/hoy/index.tsx`. Primera pestaña ("Hoy", ícono
  `Sun`) y pantalla inicial después del login.
- Deep link: `tritrack://hoy`.
- Desde aquí se va a: `/sesion/<id>`, `/checkin?session=<id>`,
  `/semana` (pestaña), `/carrera/<id>`, `/ajustes`.

## 3. Hooks

```ts
const { data, isLoading, error, refetch } = useToday();   // sin argumento = hoy
```

| Elemento | Campo |
|---|---|
| Fecha del encabezado | `data.date` → `fmtDateLong` |
| Bloque y semana | `data.block` (`name`, `week_index`) |
| Cuenta regresiva | `data.nextRace` (`name`, `days_to`, `kind`, `priority`, `id`) |
| Tarjeta de recuperación | `data.recovery` |
| Banner de semana propuesta | `data.proposedWeek` |
| Aviso de semana faltante | `data.missingWeek` |
| Lista de sesiones | `data.sessions` |

No se usa ningún otro hook. El check-in lo hace la ruta `/checkin`.

## 4. Layout (de arriba hacia abajo)

```
┌────────────────────────────────────────────────┐
│ MIÉRCOLES 14 DE OCTUBRE                  (⚙)   │ encabezado común:
│ Hoy                                            │  etiqueta = fmtDateLong en mayúsculas
│ Base hacia el olímpico · semana 6              │  13/600 textSecondary (si hay block)
├────────────────────────────────────────────────┤
│ [OfflineBanner]                (solo sin red)  │
├────────────────────────────────────────────────┤
│ ┌ StatusBanner (warning) ─────────────────────┐│ solo si missingWeek
│ │ La semana no llegó                          ││
│ │ Abrí el coach y decí "domingo".             ││
│ └─────────────────────────────────────────────┘│
│ ┌ StatusBanner (info) ────────────────────────┐│ solo si proposedWeek
│ │ Tu semana está lista                        ││
│ │ Subimos un poco la bici y metemos cuestas…  ││  primera línea del briefing
│ │                       Ver la semana →       ││
│ └─────────────────────────────────────────────┘│
├────────────────────────────────────────────────┤
│ ┌ GlassCard (próxima carrera) ────────────────┐│ solo si nextRace
│ │ PRÓXIMA CARRERA · A                 21      ││  etiqueta 11/700 + prioridad
│ │ Triatlón Olímpico Cerro Azul       días     ││  nombre 17/700, Countdown a la derecha
│ │ Triatlón olímpico                           ││  raceKindName 13/500 textSecondary
│ └─────────────────────────────────────────────┘│
├────────────────────────────────────────────────┤
│ ┌ RecoveryCard ───────────────────────────────┐│
│ │ RECUPERACIÓN                   ● 72 %       ││  % 28/800 del color del semáforo
│ │ VFC 68 ms · FC reposo 48 · Sueño 7 h 36     ││  13/600 textSecondary
│ └─────────────────────────────────────────────┘│
├────────────────────────────────────────────────┤
│ ENTRENAMIENTO DE HOY                           │ 12/700 mayúsculas textSecondary,
│ ┌ SessionCard ────────────────────────────────┐│   letterSpacing 1.5, margen 20
│ └─────────────────────────────────────────────┘│
│ ┌ SessionCard ────────────────────────────────┐│ una por sesión, en el orden de
│ └─────────────────────────────────────────────┘│   data.sessions
│   (o EmptyState de descanso)                   │
└────────────────────────────────────────────────┘
```

- Separación vertical entre bloques: 12 (lo da `GlassCard`).
- `RecoveryCard`: fondo `GlassCard` con `accentColor={Colors.recovery}`.
  Arriba a la izquierda "RECUPERACIÓN" 11/700; a la derecha un punto de 10 px
  del color del semáforo y el `%` 28/800. Debajo, en una línea: `VFC <hrv_ms>
  ms · FC reposo <rhr_bpm> · Sueño <sleep_h>` (sueño con `fmtMinutes(sleep_h *
  60)`). Cada dato `null` se omite de la línea; si todos son null, la línea
  no va.
- Cuenta regresiva: la prioridad va al lado de la etiqueta solo si no es null
  (`PRÓXIMA CARRERA · A`).

## 5. Estados

| Estado | Qué se ve |
|---|---|
| Cargando (`isLoading && !data`) | Encabezado real (la fecha se calcula con `todayLocal()`), y debajo `Skeleton` 90, 80 y dos de 120 alto, con `marginHorizontal: 20` |
| Error sin datos | Encabezado + `ErrorState` |
| Sin conexión con datos | `OfflineBanner` arriba y todo lo demás normal |
| `missingWeek` | `StatusBanner` warning, título **"La semana no llegó"**, cuerpo **"Abrí el coach y decí "domingo". Mientras tanto, entrená igual: lo que subas a Strava queda guardado."**. Sin acción. Después siguen la carrera, la recuperación y la sección de sesiones con el vacío de abajo |
| `proposedWeek` no nulo | `StatusBanner` info, título **"Tu semana está lista"**, cuerpo = primera línea no vacía de `proposedWeek.briefing_md` (sin `#` ni `*`; si es null, **"El coach dejó la semana propuesta."**), acción **"Ver la semana"**. Las sesiones se muestran igual: una semana propuesta se entrena |
| `proposedWeek.status === 'changes_requested'` | No aparece: el hook solo devuelve `proposed` |
| Sin sesiones hoy y hay semana | `EmptyState` con ícono `Coffee`, título **"Hoy es descanso"**, cuerpo **"No hay nada planeado. Si salís igual, Strava lo registra."** |
| Sin sesiones y `missingWeek` | `EmptyState` con ícono `CalendarX`, título **"Sin plan para hoy"**, sin cuerpo |
| `nextRace` null | La tarjeta de carrera no va |
| `recovery` null | `RecoveryCard` muestra "RECUPERACIÓN" y **"Sin datos de Whoop todavía"** 14/500 `textSecondary` |
| `recovery.date` anterior a hoy | Agregar abajo **"Dato del <fmtDate(recovery.date)>"** 12/500 `textTertiary` |
| `recovery_pct` null | En lugar del `%`, **"sin dato"** 15/600 `textTertiary`, sin punto |
| `block` null | La línea del bloque no va |
| Sesión hecha sin `actual` (matcheo sin datos) | "Hecho" sin números |
| Sesión con `actual.avg_hr` null | Se omite `FC …` de la línea |

## 6. Interacciones

| Toque | Hace |
|---|---|
| Tirar hacia abajo | `refetch()` |
| `SessionCard` | `router.push('/sesion/' + id)` |
| "¿Cómo te fue?" en una tarjeta | `router.push('/checkin?session=' + id)`; haptic `Light` |
| Acción "Ver la semana" del banner | `router.push('/semana')` |
| Tarjeta de próxima carrera | `router.push('/carrera/' + nextRace.id)` |
| Engranaje | `/ajustes` |

No hay mutations en esta pantalla. Al volver del check-in, el hook se refresca
solo (los hooks que escriben invalidan el cache).

## 7. Textos exactos

- Título: **Hoy**
- Etiqueta: fecha larga en mayúsculas, p. ej. **MIÉRCOLES 14 DE OCTUBRE**
- Bloque: **<block.name> · semana <week_index>**
- **PRÓXIMA CARRERA** · **RECUPERACIÓN** · **ENTRENAMIENTO DE HOY**
- **Tu semana está lista** · **Ver la semana**
- **La semana no llegó** · cuerpo de arriba
- **Hoy es descanso** · **Sin plan para hoy**
- **Sin datos de Whoop todavía** · **Dato del …** · **sin dato**
- **VFC** · **FC reposo** · **Sueño**
- Tarjeta: **Hecho** · **¿Cómo te fue?** · **RPE 5 · energía 4/5** · **opcional** · **Salteada**

## 8. Checklist de aceptación

- [ ] En modo mock se ven el banner de semana propuesta, la carrera a 21
      días, la recuperación verde 72 % y dos sesiones.
- [ ] El nado muestra "Hecho", sus datos reales y "RPE 5 · energía 4/5"; el
      trote muestra "Hecho" y el botón "¿Cómo te fue?".
- [ ] El techo de pulso es el número más grande de cada tarjeta.
- [ ] Forzando `missingWeek: true` (editando el mock localmente, sin
      commitearlo) se ve el aviso exacto y la pantalla no queda vacía.
- [ ] Sin red (modo avión con datos ya cargados) se ve el banner de sin
      conexión y el contenido de antes.
- [ ] "¿Cómo te fue?" abre la hoja de check-in y, al guardar, la tarjeta pasa
      a mostrar el RPE.
- [ ] Ningún `0:00`, `NaN`, `undefined` ni `null` en pantalla.
- [ ] Todos los textos en español rioplatense; colores solo de `colors.ts`.
- [ ] Capturas en el PR: normal, cargando, sin semana, sin conexión.

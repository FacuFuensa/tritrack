# Trofeos

## 1. Para qué existe

La sala de trofeos: arriba los récords personales por tipo de carrera, abajo
una grilla con la medalla de cada carrera terminada. Es la pantalla para
mirar lo hecho. Desde acá también se cargan resultados viejos que no tienen
tiempo.

## 2. Ruta y cómo se llega

- Archivo: `expo/app/(tabs)/trofeos/index.tsx`. Cuarta pestaña ("Trofeos",
  ícono `Trophy`).
- Sin deep link propio (el detalle tiene `tritrack://trofeo/<id>`).

## 3. Hooks

```ts
const { data, isLoading, error, refetch } = useTrophies();   // { prs, medals }
const races = useRaces();                                      // para el formulario de resultado viejo
const { saveManualResult } = useRaceActions();
```

| Elemento | Campo |
|---|---|
| Récords | `data.prs` (`kind`, `best_s`, `race_id`) |
| Grilla de medallas | `data.medals` (`medal_url`, `name`, `date`, `kind`, `result.total_s`) |
| Carreras para cargar resultado | `races.data.past` con `status !== 'dns'` y (`result` null o `result.total_s` null) |

## 4. Layout

```
┌────────────────────────────────────────────────┐
│ SALA DE TROFEOS                          (⚙)   │
│ Trofeos                                        │
├────────────────────────────────────────────────┤
│ RÉCORDS                                        │
│ ┌──────────┐┌──────────┐                     │ ScrollView horizontal, padding 20,
│ │ MEDIA    ││ MARATÓN  │                     │   tarjetas 140×96 (GlassCard sin
│ │ MARATÓN  ││          │                     │   marginHorizontal), gap 10
│ │ 1:45:12  ││ 3:58:20  │                     │ tipo 11/700 textSecondary (2 líneas)
│ └──────────┘└──────────┘                     │ tiempo 22/800 textPrimary
├────────────────────────────────────────────────┤
│ MEDALLAS                                       │
│ ┌─────────────────────┐┌─────────────────────┐ │ grilla 2 columnas, gap 12, padding 20
│ │      (medalla)      ││      (medalla)      │ │ medalla 110 px: Image redonda de
│ │ Medio Maratón del   ││ Triatlón Bahía      │ │   medal_url, o disco dorado con
│ │ Lago                ││ Serena              │ │   raceKindName (como MedalTilt sin
│ │ mar 26 mar 2026     ││ 1:17:10 · suspendido│ │   movimiento)
│ │ 1:45:12             ││                     │ │ nombre 14/700, 2 líneas
│ └─────────────────────┘└─────────────────────┘ │ fecha 12/500 textSecondary
│                                                │ tiempo 13/700 (o "sin dato")
│ [ Cargar un resultado viejo ]                  │ SecondaryButton, margen 20
└────────────────────────────────────────────────┘
```

- La celda de la grilla es una `GlassCard` sin `marginHorizontal`, centrada,
  padding 14.
- Una medalla con algún tramo `cancelled`: después del tiempo, **"·
  suspendido"** en `Colors.warning`.

### Hoja "Cargar un resultado viejo" (`BottomSheet`)

```
│ Cargar un resultado viejo                      │ título de la hoja
│ Carrera                                        │ 13/700 textSecondary
│ (10K Nocturno · 15 ago)  (…)                   │ chips de las carreras elegibles (una)
│ Tiempo total                                   │
│ [ h ] : [ mm ] : [ ss ]                        │ tres TextInput numéricos 64 de ancho
│ ▸ Parciales y puestos (opcional)               │ desplegable
│   Nado / T1 / Bici / T2 / Trote  [h:mm:ss]     │ solo si kind empieza con 'tri_'
│   [ ] Nado suspendido  [ ] Bici… [ ] Trote…    │ switches → result.cancelled
│   Puesto general  [   ] de [   ]               │
│   Puesto categoría [   ] de [   ]  Categoría [ ]│
│ [            Guardar            ]              │ PrimaryButton
```

Arma un `RaceResult`: `total_s` (null si los tres campos están vacíos),
`splits` solo con los que se cargaron, `cancelled` solo si hay alguno,
`rank_overall`/`field_overall`/`rank_division`/`field_division`/`division`
si se cargaron, y `source: 'manual'`. Llama
`saveManualResult(raceId, result)`.

## 5. Estados

| Estado | Qué se ve |
|---|---|
| Cargando | 3 `Skeleton` 140×96 en fila y 4 de 180 en grilla |
| Error sin datos | `ErrorState` |
| Sin conexión con datos | `OfflineBanner` |
| `prs` vacío | Sección RÉCORDS con **"Todavía no hay récords: se arman con las carreras terminadas con tiempo."** 14/500 `textSecondary` |
| `medals` vacío | `EmptyState` `Medal` **"Todavía no hay medallas"**, cuerpo **"Cuando termines una carrera, aparece acá."** |
| `total_s` null | **"sin dato"** en `textTertiary` (nunca `0:00`) |
| Sin carreras elegibles | El botón "Cargar un resultado viejo" no va |
| Guardando | `PrimaryButton` con `loading` |
| Total con formato inválido (minutos o segundos > 59) | Guardar deshabilitado y **"Revisá el tiempo"** 12/600 `Colors.danger` |
| Error al guardar | **"No se pudo guardar. Probá de nuevo."** dentro de la hoja |

## 6. Interacciones

| Toque | Hace |
|---|---|
| Tarjeta de récord | `router.push('/trofeo/' + race_id)` |
| Medalla | `router.push('/trofeo/' + id)` |
| Cargar un resultado viejo | Abre la hoja |
| Guardar (hoja) | `await saveManualResult(id, result)`; éxito → haptic `Success`, cierra la hoja |
| Tirar hacia abajo | `refetch()` |

## 7. Textos exactos

**SALA DE TROFEOS** · **Trofeos** · **RÉCORDS** · **MEDALLAS** · tipos en
mayúsculas de `raceKindName` · **· suspendido** · **sin dato** · **Cargar un
resultado viejo** · **Carrera** · **Tiempo total** · **▸ Parciales y puestos
(opcional)** · **Nado** · **T1** · **Bici** · **T2** · **Trote** · **Nado
suspendido** · **Bici suspendida** · **Trote suspendido** · **Puesto
general** · **Puesto categoría** · **de** · **Categoría** · **Guardar** ·
**Revisá el tiempo** · **No se pudo guardar. Probá de nuevo.** · **Todavía no
hay récords: se arman con las carreras terminadas con tiempo.** · **Todavía no
hay medallas** · **Cuando termines una carrera, aparece acá.**

## 8. Checklist de aceptación

- [ ] En mock: un solo récord (Media maratón 1:45:12). El sprint de Bahía
      Serena **no** es récord (tiene el nado suspendido) y el 10K **no** (sin
      tiempo).
- [ ] 3 medallas, la más reciente primero; la del 10K dice "sin dato" y la de
      Bahía Serena "1:17:10 · suspendido".
- [ ] Cargar un resultado viejo para el 10K Nocturno con 42:30 hace aparecer
      el récord de 10K y actualiza su medalla.
- [ ] Ningún `0:00` en pantalla.
- [ ] Capturas: con datos, vacía, hoja abierta con parciales.

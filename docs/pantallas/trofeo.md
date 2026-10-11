# Trofeo (detalle)

## 1. Para qué existe

El recuerdo de una carrera terminada: la medalla que se inclina con el
teléfono, el tiempo total, cómo se repartió entre nado, transiciones, bici y
trote, los puestos, el pulso por tramo, los enlaces a Strava y la comparación
con otras ediciones de la misma carrera. Desde acá se cambia la foto de la
medalla.

## 2. Ruta y cómo se llega

- Archivo: `expo/app/trofeo/[id].tsx` (push, `headerShown: false`).
- Desde Trofeos (medalla o récord), desde el detalle de una carrera corrida
  ("Ver resultado y medalla") y con `tritrack://trofeo/<race_id>`.

## 3. Hooks

```ts
const { id } = useLocalSearchParams<{ id: string }>();
const { data: race, isLoading, error, refetch } = useRace(id);
const trophies = useTrophies();          // medals: para las otras ediciones
const { setMedal } = useRaceActions();
```

| Elemento | Campo |
|---|---|
| Medalla | `race.medal_url`, `race.kind` → `MedalTilt` |
| Encabezado | `race.name`, `date`, `location`, `kind` |
| Tiempo total | `race.result.total_s` |
| Parciales | `race.result` → `SplitBar`, `segmentState`, `segmentSeconds` |
| Puestos | `rank_overall`/`field_overall`, `rank_division`/`field_division`/`division` |
| FC por tramo | `race.result.hr_by_segment` |
| Strava | `race.activity_ids` |
| Otras ediciones | `trophies.data.medals` con el mismo `name` y otro `id` |
| ¿Récord? | `trophies.data.prs` con `race_id === race.id` |

## 4. Layout

```
┌────────────────────────────────────────────────┐
│ ‹ Volver                                       │
│                                                │
│               ( MedalTilt 220 )                │ centrada, margen arriba 8, abajo 20
│                                                │
│ TRIATLÓN SPRINT · BAHÍA SERENA                 │ 12/700 textSecondary, centrado
│ Triatlón Bahía Serena                          │ 28/800 centrado
│ sáb 14 jun 2026                                │ 15/500 textSecondary centrado
│ [ Récord personal ]                            │ píldora success, solo si es PR
├────────────────────────────────────────────────┤
│ ┌ GlassCard ──────────────────────────────────┐│
│ │ TIEMPO TOTAL                                ││ 11/700
│ │ 1:17:10                                     ││ 44/800
│ │ <SplitBar result>                           ││
│ │ ● Nado suspendido  ● T1 1:35  ● Bici 45:10  ││ leyenda de SplitBar
│ │ ● T2 1:10  ● Trote 29:15                    ││
│ └─────────────────────────────────────────────┘│
│ ┌ GlassCard ──────────────────────────────────┐│ solo si hay algún puesto
│ │ PUESTOS                                     ││
│ │ General         214 de 1830                 ││ etiqueta 14/500, valor 17/800
│ │ M35-39          31 de 260                   ││ etiqueta = division o "Categoría"
│ └─────────────────────────────────────────────┘│
│ ┌ GlassCard ──────────────────────────────────┐│ solo si hr_by_segment
│ │ PULSO POR TRAMO                             ││
│ │ ● Bici   158                                ││ una fila por tramo con dato, del color
│ │ ● Trote  166                                ││   de la disciplina; valor 17/800 + "lpm"
│ └─────────────────────────────────────────────┘│
│ ┌ GlassCard ──────────────────────────────────┐│ solo si activity_ids no está vacío
│ │ ↗ Ver en Strava                             ││ una fila por id: "Ver en Strava"
│ └─────────────────────────────────────────────┘│   (si hay más de uno: "Actividad 1", …)
│ OTRAS EDICIONES                                │ solo si hay
│ ┌ GlassCard ──────────────────────────────────┐│
│ │ 2025     1:21:40     +4:30                  ││ año 15/700, tiempo 15/700,
│ │ 2026     1:17:10     esta                   ││   diferencia vs esta 13/700
│ └─────────────────────────────────────────────┘│   (más rápido success, más lento danger)
│ [ Cambiar medalla ]                            │ SecondaryButton
│ Resultado cargado de: resultados oficiales     │ 11/500 textTertiary (result.source)
└────────────────────────────────────────────────┘
```

Otras ediciones: ordenadas por fecha, incluye esta (marcada **"esta"**). La
diferencia se calcula solo si las dos tienen `total_s` y ninguna tiene tramos
suspendidos; si no, **"no comparable"** 13/600 `textTertiary`.

Enlace a Strava: `https://www.strava.com/activities/<id>` con
`WebBrowser.openBrowserAsync`.

## 5. Estados

| Estado | Qué se ve |
|---|---|
| Cargando | Volver + círculo `Skeleton` 220 + `Skeleton` 30, 20, 160 |
| Error sin datos | Volver + `ErrorState` |
| Sin conexión con datos | `OfflineBanner` debajo de Volver |
| `race === null` | `EmptyState` `SearchX` **"No encontramos este trofeo"**, acción **"Ir a Trofeos"** |
| `race.status !== 'done'` | `EmptyState` **"Esta carrera todavía no se corrió"**, acción **"Ver la carrera"** → `/carrera/<id>` |
| `result` null | Tarjeta TIEMPO TOTAL con **"sin dato"** 28/800 `textTertiary` y **"Cargalo desde Trofeos → Cargar un resultado viejo."** 13/500 |
| `total_s` null | **"sin dato"** en lugar del tiempo (nunca `0:00`) |
| Tramo suspendido | En `SplitBar` rayado y en la leyenda **"Nado suspendido"** (o Bici suspendida / Trote suspendido) |
| Split que falta | Leyenda **"<Tramo> sin dato"**; no ocupa barra |
| Carrera de pedestrismo (`run_*`) | Sin `SplitBar`: solo el tiempo total |
| Sin `medal_url` | `MedalTilt` con el disco dorado |
| DeviceMotion no disponible | La medalla se arrastra con el dedo (lo hace `MedalTilt`) |
| Cambiando medalla | Botón con `loading` |
| Error al cambiar medalla | **"No se pudo subir la foto. Probá de nuevo."** `Colors.danger` |
| Permiso de fotos negado | **"Necesito acceso a tus fotos para cambiar la medalla."** + botón **"Abrir Ajustes del teléfono"** → `Linking.openSettings()` |

## 6. Interacciones

| Toque / gesto | Hace |
|---|---|
| Inclinar el teléfono | La medalla rota (±30°, relativo a cómo lo sostenés) y el brillo se desplaza |
| Volver | `router.back()` |
| Ver en Strava | Abre la actividad en el navegador |
| Fila de otra edición | `router.replace('/trofeo/' + otroId)` |
| **Cambiar medalla** | `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 })`; si elige → `await setMedal(race.id, asset.uri)`; éxito → haptic `Success` |
| Tirar hacia abajo | `refetch()` |

## 7. Textos exactos

**Volver** · **Récord personal** · **TIEMPO TOTAL** · **sin dato** ·
**Cargalo desde Trofeos → Cargar un resultado viejo.** · **Nado** · **T1** ·
**Bici** · **T2** · **Trote** · **Nado suspendido** · **Bici suspendida** ·
**Trote suspendido** · **<Tramo> sin dato** · **PUESTOS** · **General** ·
**Categoría** · **<n> de <m>** · **PULSO POR TRAMO** · **lpm** · **Ver en
Strava** · **Actividad <n>** · **OTRAS EDICIONES** · **esta** · **no
comparable** · **Cambiar medalla** · **Resultado cargado de: <source>** ·
textos de error y vacío de la tabla.

## 8. Checklist de aceptación

- [ ] Bahía Serena (mock): medalla dorada que se inclina con el teléfono,
      1:17:10, barra con el nado rayado y "Nado suspendido", puestos 12 de
      88 en M35-39, pulso de bici y trote.
- [ ] Medio Maratón del Lago: sin barra de parciales, "Récord personal",
      214 de 1830.
- [ ] 10K Nocturno: "sin dato" en el total, nunca `0:00`.
- [ ] Cambiar medalla con una foto la muestra en la medalla y en la grilla de
      Trofeos.
- [ ] En web la medalla se puede arrastrar con el mouse.
- [ ] Capturas: con medalla, con nado suspendido, sin tiempo.

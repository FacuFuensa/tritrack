# Sesión (detalle)

## 1. Para qué existe

Muestra una sesión completa como la escribió el coach: para qué sirve, el
techo de pulso, los pasos o los ejercicios con sus series y cues. Si ya se
hizo, compara lo planeado con lo real y dice cuánto del tiempo quedó bajo el
techo. Es la pantalla que se mira antes de salir a entrenar.

## 2. Ruta y cómo se llega

- Archivo: `expo/app/sesion/[id].tsx` (push sobre la pestaña; `headerShown:
  false`, encabezado propio).
- Se llega tocando una `SessionCard` en Hoy o en Semana.
- No tiene deep link propio (las notificaciones van a `/checkin`).

## 3. Hooks

```ts
const { id } = useLocalSearchParams<{ id: string }>();
const { data: s, isLoading, error, refetch } = useSession(id);
```

| Elemento | Campo |
|---|---|
| Disciplina, color | `s.discipline` |
| Título | `s.title` |
| Fecha y turno | `s.date`, `s.slot` |
| Techo | `s.prescription.hr_cap` |
| Duración, distancia, ritmo | `s.prescription.dur_min`, `.distance_m`, `.pace` |
| Para qué | `s.prescription.why` |
| Etiquetas | `s.prescription.tags` |
| Pasos | `s.prescription.steps` |
| Ejercicios | `s.prescription.exercises` |
| Plan vs real | `s.prescription` vs `s.actual` |
| % bajo el techo | `s.actual.pct_under_cap` |
| Check-in | `s.checkin` |

## 4. Layout

```
┌────────────────────────────────────────────────┐
│ ‹ Volver                                       │ fila 44 alto, ChevronLeft + "Volver"
├────────────────────────────────────────────────┤   15/600 Colors.accent
│ ● NADO · MIÉ 14 OCT · AM                       │ 12/700 mayúsculas, color disciplina
│ Nado continuo                                  │ 28/800
│ [fondo] [especifico]                           │ píldoras de tags 11/700 textSecondary
├────────────────────────────────────────────────┤   sobre backgroundCard, radio 8
│ ┌ GlassCard accent=disciplina ────────────────┐│
│ │    150          45 min      2000 m   5:40   ││ HrCapBadge lg a la izquierda;
│ │   techo         duración    distancia ritmo ││   tres datos 20/800 + etiqueta 11/700
│ └─────────────────────────────────────────────┘│   (solo los que existan)
│ ┌ GlassCard ──────────────────────────────────┐│ solo si why
│ │ PARA QUÉ                                    ││ 11/700
│ │ Aguantar ritmo parejo sin parar.            ││ 15/500 textPrimary
│ └─────────────────────────────────────────────┘│
│ PASOS                                          │ sección (si steps)
│ ┌ GlassCard ──────────────────────────────────┐│
│ │ 1  Entrada en calor            300 m        ││ número en círculo 22 del color
│ │    Suave, alternando estilos                ││   label 15/600, dato 15/700 derecha
│ │ 2  Continuo                    1500 m  ≤150 ││   note/target 13/500 textSecondary
│ │    Ritmo de carrera                         ││   HrCapBadge sm si el paso tiene hr_cap
│ │ 3  Vuelta a la calma           200 m        ││   separador 1 px cardBorder
│ └─────────────────────────────────────────────┘│
│ EJERCICIOS                                     │ sección (si exercises)
│ ┌ GlassCard ──────────────────────────────────┐│
│ │ Sentadilla búlgara              3 × 8 por p.││ name 15/600, "sets × reps" 15/700
│ │ Rodilla alineada con el pie                 ││ cue 13/500 textSecondary, itálica
│ └─────────────────────────────────────────────┘│
│ CÓMO SALIÓ                                     │ sección (solo si status done)
│ ┌ GlassCard accent=success ───────────────────┐│
│ │            PLAN        REAL                 ││ tabla 3 columnas
│ │ Distancia  2000 m      2050 m               ││ etiquetas 13/500 textSecondary
│ │ Tiempo     45 min      44:10                ││ valores 15/700
│ │ Ritmo      —           2:09 /100 m          ││
│ │ FC media   ≤ 150       138                  ││
│ │ FC máx     —           149                  ││
│ │ ─────────────────────────────────────────── ││
│ │ 100 % del tiempo bajo el techo              ││ 17/800 success (o "sin dato")
│ └─────────────────────────────────────────────┘│
│ ┌ GlassCard ──────────────────────────────────┐│ check-in (si done)
│ │ TU CHECK-IN                                 ││
│ │ RPE 5 · Energía 4/5                         ││
│ │ Molestia: hombro derecho (tirante)          ││
│ │ "Agua fría, costó arrancar."                ││
│ └─────────────────────────────────────────────┘│
│   o  [ ¿Cómo te fue? ]  PrimaryButton          │ si done y sin check-in
└────────────────────────────────────────────────┘
```

Títulos de sección: 12/700 mayúsculas `textSecondary`, letterSpacing 1.5,
`marginHorizontal: 20`, margen arriba 8.

Formato de un paso, a la derecha: `reps × ` si hay `reps`, después
`distance_m` (`fmtDistance`) o `dur_min` (`fmtMinutes`). Si no hay nada, no
va dato.

Plan vs real: el ritmo real usa `fmtSwimPace` para nado y `fmtPace` para el
resto. Una fila se omite si plan y real son los dos null.

## 5. Estados

| Estado | Qué se ve |
|---|---|
| Cargando | Fila Volver + `Skeleton` 30 (título), 90, 70, 200 |
| Error sin datos | Fila Volver + `ErrorState` |
| Sin conexión con datos | `OfflineBanner` debajo de Volver |
| `data === null` | `EmptyState` con `SearchX`, título **"Esta sesión ya no existe"**, cuerpo **"El coach pudo haber cambiado la semana."**, acción **"Ir a Hoy"** → `router.replace('/hoy')` |
| `title` null | Título = `disciplineName(discipline)` |
| `discipline` null | Color `Colors.accent`, sin punto, etiqueta sin disciplina |
| Sin `steps` ni `exercises` | Solo la tarjeta de números y el para qué |
| `pct_under_cap` null | **"Sin dato de pulso para calcular el tiempo bajo el techo"** 14/500 `textSecondary` |
| Sin `hr_cap` | La fila FC media muestra plan "—" y no va el renglón del % |
| `status === 'skipped'` | Píldora **"Salteada"** al lado del título; no hay "Cómo salió" ni botón de check-in |
| `status === 'planned'` | No hay "Cómo salió" ni check-in |
| Hecho sin `actual` | "Cómo salió" con **"Strava no trajo datos de esta actividad."** |

Un valor real o planeado que falta se muestra **"—"** (raya), nunca `0`.

## 6. Interacciones

| Toque | Hace |
|---|---|
| "Volver" o gesto atrás | `router.back()` |
| "¿Cómo te fue?" | `router.push('/checkin?session=' + s.id)` |
| Tirar hacia abajo | `refetch()` |

Sin mutations.

## 7. Textos exactos

**Volver** · **techo** · **duración** · **distancia** · **ritmo** ·
**PARA QUÉ** · **PASOS** · **EJERCICIOS** · **CÓMO SALIÓ** · **PLAN** ·
**REAL** · **Distancia** · **Tiempo** · **Ritmo** · **FC media** · **FC máx** ·
**<n> % del tiempo bajo el techo** · **TU CHECK-IN** · **RPE <n> · Energía
<n>/5** · **Molestia: <zona> (<nivel>)** con niveles **nada / tirante /
dolor / calambre** · **¿Cómo te fue?** · **Salteada** ·
**Esta sesión ya no existe** · **Ir a Hoy**.

Etiquetas (`tags`): pierna_pesada **pierna pesada** · calidad_carrera
**calidad** · fondo **fondo** · especifico **específico** · simulacro
**simulacro**.

## 8. Checklist de aceptación

- [ ] En mock, "Nado continuo" muestra 3 pasos, techo 150, el para qué,
      "Cómo salió" con 2050 m / 44:10 y "100 % del tiempo bajo el techo".
- [ ] "Trote suave" muestra "Sin dato de pulso…" (su máximo pasó el techo) y
      el botón "¿Cómo te fue?".
- [ ] "Fuerza A" muestra 3 ejercicios con sus cues y ningún bloque de pasos.
- [ ] Un id inexistente (`/sesion/x`) muestra "Esta sesión ya no existe".
- [ ] Ninguna celda con `0`, `NaN` o vacía: lo que falta es "—".
- [ ] Capturas: nado hecho, trote sin dato, gimnasio, id inexistente.

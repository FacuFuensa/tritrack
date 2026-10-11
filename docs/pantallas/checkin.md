# Check-in

## 1. Para qué existe

Después de entrenar, decirle al coach cómo fue en menos de 10 segundos: qué
tan duro (RPE) y con cuánta energía. Lo demás (molestia, geles, nota) es
opcional y está plegado. El coach lo lee el domingo para decidir la semana.

## 2. Ruta y cómo se llega

- Archivo: `expo/app/checkin.tsx`, registrado en el Stack raíz con
  `presentation: 'formSheet'`, `sheetAllowedDetents: [0.75, 1]`,
  `sheetGrabberVisible: true`, `headerShown: false`.
- Parámetros: `session` (uuid de `plan_sessions`) **o** `activity`
  (`external_id` de Strava). Uno de los dos.
- Se llega desde "¿Cómo te fue?" (Hoy, Sesión) y desde la notificación
  **"¿Cómo te fue en …?"**: deep links `tritrack://checkin?session=<uuid>` y
  `tritrack://checkin?activity=<external_id>`.

## 3. Hooks

```ts
const { session, activity } = useLocalSearchParams<{ session?: string; activity?: string }>();
const { data: s, isLoading } = useSession(session ?? '');   // deshabilitado si no hay session
const { submit } = useCheckin();
```

| Elemento | Campo |
|---|---|
| Título de la hoja | `s.title` (o `disciplineName(s.discipline)`); con `activity`, texto fijo |
| Fecha del check-in | `s.date`; con `activity`, `todayLocal()` |
| Ya hecho | `s.checkin` |

Al guardar:

```ts
await submit({
  date,                          // ver arriba
  session_id: session,           // o activity_id: activity
  rpe, energia,                  // obligatorios
  molestia: zona ? { zona, nivel } : undefined,
  nutricion: geles > 0 ? { geles } : undefined,
  nota: nota.trim() || undefined,
});
```

## 4. Layout

```
┌──────────── manija del formSheet ──────────────┐
│ ¿Cómo te fue en Trote suave?                   │ 22/800, máx 2 líneas
│ MIÉ 14 OCT                                     │ 12/700 textSecondary
│                                                │
│ ¿Qué tan duro fue?                             │ 15/700
│ [1][2][3][4][5][6][7][8][9][10]                │ ScaleSelector, color Colors.accent
│ muy suave                        al máximo     │ labels 1 y 10
│                                                │
│ ¿Cómo estaba tu energía?                       │ 15/700
│ [1] [2] [3] [4] [5]                            │ ScaleSelector, color Colors.recovery
│ vacío                                  a tope  │
│                                                │
│ ▸ Agregar molestia, geles o nota               │ 14/600 Colors.accent (plegado)
│ ┌ (desplegado) ───────────────────────────────┐│
│ │ Molestia                                    ││ 13/700 textSecondary
│ │ (Rodilla)(Tobillo)(Gemelo)(Isquios)(Cuádr.) ││ chips en 2-3 filas (flexWrap),
│ │ (Cadera)(Espalda baja)(Hombro)(Pie)(Otra)   ││   uno solo elegible, tocar de nuevo
│ │ [nada][tirante][dolor][calambre]            ││   lo deselecciona
│ │                                             ││ nivel: aparece al elegir zona
│ │ Geles     (−)  2  (+)                       ││ stepper 0–6
│ │ Nota                                        ││
│ │ [ Algo que el coach tenga que saber…     ]  ││ TextInput multilínea, 3 líneas,
│ └─────────────────────────────────────────────┘│   máx 280 caracteres
│                                                │
│ [            Guardar            ]              │ PrimaryButton, fijo abajo
└────────────────────────────────────────────────┘
```

- Fondo `Colors.backgroundLight`, padding 20.
- Chips: alto 34, radio 17, padding horizontal 14, 13/600. Elegido: fondo
  `Colors.warning + '25'`, borde `Colors.warning`, texto `Colors.warning`.
- Nivel: `ScaleSelector` con valores `[0,1,2,3]` mostrando los textos en vez
  de números (botones con texto 13/600), color `Colors.warning`. Por
  defecto, 1 ("tirante") al elegir una zona.
- El teclado no debe tapar el botón: `KeyboardAvoidingView` con
  `behavior="padding"`.

## 5. Estados

| Estado | Qué se ve |
|---|---|
| Cargando la sesión | Título **"¿Cómo te fue?"** y los selectores igual (se puede cargar sin esperar) |
| Error o sesión inexistente | Título **"¿Cómo te fue?"**; se guarda igual con `session_id` |
| Con `activity` | Título **"¿Cómo te fue en tu entrenamiento?"** |
| Ya tiene check-in (`s.checkin`) | Arriba, nota 13/500 `textSecondary`: **"Ya cargaste uno. Si guardás de nuevo, vale el último."**, selectores precargados con esos valores |
| Falta RPE o energía | Botón deshabilitado (opacidad 0.4) |
| Guardando | Botón con `loading` |
| Error al guardar | Debajo del botón, **"No se pudo guardar. Revisá la conexión y probá de nuevo."** 13/600 `Colors.danger`; la hoja queda abierta con lo cargado |
| Sin parámetros | `EmptyState` **"No sé de qué entrenamiento es"** y acción **"Cerrar"** |

## 6. Interacciones

| Toque | Hace |
|---|---|
| Número de RPE / energía | Elige; haptic `Selection` |
| "Agregar molestia, geles o nota" | Despliega la sección (LayoutAnimation) y el texto cambia a **"▾ Ocultar"** |
| Chip de zona | Elige o deselecciona; con zona elegida aparece el nivel |
| (−) / (+) | Geles 0–6 |
| Guardar | `submit(...)`; si sale bien: haptic `Success` y `router.back()` |
| Deslizar hacia abajo | Cierra sin guardar (sin confirmación) |

Camino rápido: tocar RPE, tocar energía, Guardar = 3 toques.

## 7. Textos exactos

**¿Cómo te fue en <título>?** · **¿Cómo te fue?** · **¿Cómo te fue en tu
entrenamiento?** · **¿Qué tan duro fue?** · **muy suave** · **al máximo** ·
**¿Cómo estaba tu energía?** · **vacío** · **a tope** · **▸ Agregar molestia,
geles o nota** · **▾ Ocultar** · **Molestia** · zonas: **Rodilla, Tobillo,
Gemelo, Isquios, Cuádriceps, Cadera, Espalda baja, Hombro, Pie, Otra** ·
niveles: **nada, tirante, dolor, calambre** · **Geles** · **Nota** ·
placeholder **Algo que el coach tenga que saber…** · **Guardar** · **Ya
cargaste uno. Si guardás de nuevo, vale el último.** · **No se pudo guardar.
Revisá la conexión y probá de nuevo.** · **No sé de qué entrenamiento es** ·
**Cerrar**.

La zona se guarda en minúsculas (`'rodilla'`, `'espalda baja'`, …).

## 8. Checklist de aceptación

- [ ] Desde Hoy (mock), "¿Cómo te fue?" del trote abre la hoja con el título
      "¿Cómo te fue en Trote suave?".
- [ ] Con 3 toques (RPE, energía, Guardar) se guarda, la hoja se cierra y la
      tarjeta de Hoy muestra el RPE.
- [ ] Guardar sigue deshabilitado hasta tener RPE y energía.
- [ ] El nado (que ya tiene check-in) abre precargado y con el aviso.
- [ ] `tritrack://checkin?activity=123` abre la hoja con el título genérico.
- [ ] El teclado de la nota no tapa el botón.
- [ ] Capturas: plegada, desplegada con molestia, error al guardar.

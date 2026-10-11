# Trofeos — verificación en modo mock

Capturas de Expo web, 390 × 844, zona America/Chicago. Solo datos ficticios de
los hooks mock; no se incluyen fotos personales de medallas.

## Capturas principales

| Caso | Captura |
| --- | --- |
| Grilla: un PR, tres medallas y placeholder | [grilla.png](grilla.png) |
| Triatlón con nado suspendido | [detalle-nado-suspendido.png](detalle-nado-suspendido.png) |
| Puestos y FC por tramo | [detalle-puestos-pulso.png](detalle-puestos-pulso.png) |
| 10K después de guardar 42:30 | [detalle-10k.png](detalle-10k.png) |
| Carrera sin tiempo | [detalle-sin-tiempo.png](detalle-sin-tiempo.png) |
| Resultado nulo | [detalle-resultado-null.png](detalle-resultado-null.png) |
| Formulario manual | [formulario-manual.png](formulario-manual.png) |
| Formulario con parciales y nado suspendido | [formulario-parciales.png](formulario-parciales.png) |
| Media maratón con PR | [detalle-media-maraton.png](detalle-media-maraton.png) |
| Otras ediciones | [detalle-otras-ediciones.png](detalle-otras-ediciones.png) |
| Arrastre de la medalla en web | [detalle-medalla-inclinada.png](detalle-medalla-inclinada.png) |
| Cambio de imagen | [detalle-medalla-cambiada.png](detalle-medalla-cambiada.png), [grilla-medalla-cambiada.png](grilla-medalla-cambiada.png) |

También se incluyen grilla vacía, carga, error, sin conexión; detalle cargando,
error, sin conexión, inexistente y carrera no corrida; formulario inválido,
guardando y error al guardar.

## Reproducir

1. Desde `expo/`, iniciar Expo con `EXPO_PUBLIC_DATA_MODE=mock` y recarga activa
   en el puerto 8084 (sin `CI=1`).
2. Ejecutar `node scripts/verify-trophies.cjs`. Playwright se proporciona desde
   el entorno externo mediante `TRITRACK_PLAYWRIGHT_MODULE`, sin dependencias
   nuevas en la app. `TRITRACK_QA_URL` permite cambiar el puerto.

El script agrega un puente temporal al layout para cambiar estados de consultas
y provocar errores de escritura; restaura el archivo en `finally`. No modifica
`expo/data/`. La foto usada en la prueba de cambio es una captura del disco
placeholder, no una medalla personal. Las ediciones adicionales y el triatlón
elegible para carga manual se inyectan solo en el cache de la sesión de QA.

## Checklist de los planos

- [x] Mock inicial: solo PR de media maratón 1:45:12.
- [x] Tres medallas, ordenadas; 10K sin dato; sprint 1:17:10 · suspendido.
- [x] Guardar 42:30 en el 10K actualiza grilla y crea su récord.
- [x] Valores ausentes y parciales suspendidos nunca se muestran como 0:00.
- [x] Capturas de grilla con datos/vacía y formulario con parciales.
- [x] Sprint: disco dorado, barra rayada, M35-39 12 de 88, FC bici/trote.
- [x] Media maratón: sin SplitBar, PR y puesto 214 de 1830.
- [x] Cambio de foto actualiza detalle y grilla a través de `setMedal`.
- [x] Arrastre de medalla comprobado en web.
- [x] Capturas de medalla, nado suspendido y sin tiempo.
- [ ] Verificación física del giroscopio en iOS: requiere la build de TestFlight
  con `expo-sensors`. La implementación limita a ±18° y limpia el sensor al
  perder foco; el recorrido web prueba el fallback por arrastre.

## Diferencias para revisar

El prompt pide «Sin tiempo registrado» para `result === null`; el plano y el
contrato exigen «sin dato» junto con «Cargalo desde Trofeos → Cargar un resultado
viejo.». Se implementó el texto del plano, según AGENTS.md.

El formulario vive en Trofeos como indica el plano; el detalle dirige allí.
Los PNG personales se preparan y suben en la ronda R, fuera de este repo público.

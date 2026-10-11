# Hoy, sesión, check-in y Semana

Implementa los pasos 1–4 de los planos en un solo PR: componentes compartidos, cuatro pestañas, detalle de sesión, check-in como formSheet y Semana con aceptación, cambios e historial. Los datos se leen y escriben únicamente mediante los hooks existentes. Carreras y Trofeos (incluidos los destinos de deep links) muestran Próximamente.

## Validación

- Modo mock web, viewport de 390 × 844 px, zona America/Chicago.
- Pruebas de interfaz: guardar RPE/energía desde Hoy, precarga, guardado fallido sin perder datos, propuesta → aceptada, desaparición del banner, pedido de cambios y sus errores, navegación histórica y semana inexistente.
- Estados de carga, error y desconexión inyectados exclusivamente en el cache de TanStack durante QA. Sin modificar expo/data/ ni sus mocks. El script temporalmente instrumenta el layout en modo desarrollo y lo restaura con finally.
- Typecheck, lint y npm test: resultados finales al pie.

## Checklists de aceptación

### hoy.md

- [x] En modo mock se ven el banner de semana propuesta, la carrera a 21
      días, la recuperación verde 72 % y dos sesiones.
- [x] El nado muestra "Hecho", sus datos reales y "RPE 5 · energía 4/5"; el
      trote muestra "Hecho" y el botón "¿Cómo te fue?".
- [x] El techo de pulso es el número más grande de cada tarjeta.
- [x] Forzando `missingWeek: true` (editando el mock localmente, sin
      commitearlo) se ve el aviso exacto y la pantalla no queda vacía.
- [x] Sin red (modo avión con datos ya cargados) se ve el banner de sin
      conexión y el contenido de antes.
- [x] "¿Cómo te fue?" abre la hoja de check-in y, al guardar, la tarjeta pasa
      a mostrar el RPE.
- [x] Ningún `0:00`, `NaN`, `undefined` ni `null` en pantalla.
- [x] Todos los textos en español rioplatense; colores solo de `colors.ts`.
- [x] Capturas en el PR: normal, cargando, sin semana, sin conexión.

### sesion.md

- [x] En mock, "Nado continuo" muestra 3 pasos, techo 150, el para qué,
      "Cómo salió" con 2050 m / 44:10 y "100 % del tiempo bajo el techo".
- [x] "Trote suave" muestra "Sin dato de pulso…" (su máximo pasó el techo) y
      el botón "¿Cómo te fue?".
- [x] "Fuerza A" muestra 3 ejercicios con sus cues y ningún bloque de pasos.
- [x] Un id inexistente (`/sesion/x`) muestra "Esta sesión ya no existe".
- [x] Ninguna celda con `0`, `NaN` o vacía: lo que falta es "—".
- [x] Capturas: nado hecho, trote sin dato, gimnasio, id inexistente.

### checkin.md

- [x] Desde Hoy (mock), "¿Cómo te fue?" del trote abre la hoja con el título
      "¿Cómo te fue en Trote suave?".
- [x] Con 3 toques (RPE, energía, Guardar) se guarda, la hoja se cierra y la
      tarjeta de Hoy muestra el RPE.
- [x] Guardar sigue deshabilitado hasta tener RPE y energía.
- [x] El nado (que ya tiene check-in) abre precargado y con el aviso.
- [ ] `tritrack://checkin?activity=123` abre la hoja con el título genérico. Ruta `/checkin?activity=123` verificada en web; falta abrir el esquema nativo desde iOS.
- [ ] El teclado de la nota no tapa el botón. Implementado `KeyboardAvoidingView` con `behavior="padding"` y pie fijo; falta verificar con teclado de iOS. Web con nota enfocada tiene captura.
- [x] Capturas: plegada, desplegada con molestia, error al guardar.

### semana.md

- [x] En mock se ve "SEMANA 6 · CONSTRUCCIÓN", la propuesta con Aceptar y
      Pedir cambios, volumen con nado 2050 / 2000 m y Z2 100 %.
- [x] Aceptar cambia la tarjeta a "BRIEFING" y el banner de Hoy desaparece.
- [x] Pedir cambios con texto deja la tarjeta "PEDISTE CAMBIOS" con la cita.
- [x] `‹` lleva a la semana 5 (aceptada, 1 de 2 hechas, la otra "Salteada");
      `‹` otra vez muestra "No hay plan para esta semana".
- [x] "SEMANAS ANTERIORES" lista la semana 5 y tocándola navega.
- [x] Los puntos de la tira coinciden con las sesiones de cada día.
- [x] Capturas: propuesta, aceptada, cambios pedidos, semana vacía, sin conexión.

## Diferencias de contrato y límites

- WeekStrip: el plano define dots como disciplinas pero pide opacidad por estado. Agregué una prop de presentación opcional doneDots, derivada de SessionView.status. No se inventan campos ni se modifica la capa de datos.
- A 390 px los diez botones de RPE se reparten el ancho disponible: mantienen 40 px de alto; no pueden medir 40 px de ancho todos en una fila con el padding de 20 px que pide el mismo plano.
- El modo mock trabaja con fechas relativas a hoy; las capturas corresponden al domingo 11 de octubre de 2026.
- Las pantallas anteriores se conservan ocultas hasta el PR de limpieza indicado en el README. TrainingProvider queda en el arranque, usado por Ajustes y pantallas anteriores.
- No hay campos de datos faltantes que impidan estas cuatro pantallas.
- No se probó en dispositivo iOS: formSheet, teclado y apertura del esquema tritrack:// requieren validación nativa.

## Capturas

Ver [galería e instrucciones de reproducción](capturas/hoy-semana/README.md). Todas las imágenes son PNG de 390 px de ancho; cada estado tiene su archivo.

## Resultado final de checks

- npm run typecheck: OK.
- npm run lint: OK (0 errores, 13 advertencias preexistentes en pantallas/componentes anteriores).
- npm test: 16/16 OK. Node emite la advertencia preexistente MODULE_TYPELESS_PACKAGE_JSON; no hay fallos.
- Script de UI: PASS, 48 capturas, sin errores de ejecución del navegador.
- Revisión independiente: sin hallazgos bloqueantes; corregidas las dos observaciones menores sobre volumen vacío y días sin sesiones.

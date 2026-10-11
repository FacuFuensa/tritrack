# Hoy y Semana — implementación

**Objetivo:** implementar los pasos base, Hoy, Sesión y Semana en un único PR desde `codex/hoy-semana`.
**Especificación:** `docs/pantallas/{README,hoy,sesion,checkin,semana}.md`, `docs/contratos.md` y `AGENTS.md`.
**Arquitectura:** componentes de presentación memoizados; pantallas que consumen exclusivamente los hooks de lectura y escritura existentes. Expo Router mantiene los deep links y el check-in como formSheet. Sin dependencias nuevas.

- [x] Base: formatos puros, botones, estados, tarjetas, markdown, selectores y tira semanal. Probar fechas locales, nulos y formatos numéricos con Node.
- [x] Navegación: cuatro pestañas, engranaje, inicio Hoy, rutas de detalle y hoja, enlaces en frío y página desconocida. Mantener las pantallas viejas ocultas hasta el PR de limpieza.
- [x] Hoy: todos los estados de lectura, propuesta, semana faltante, recuperación, carrera y sesiones. Verificar en mock y abrir check-in desde trote.
- [x] Sesión: números, pasos, ejercicios, comparación real, pulso faltante y check-in. Verificar nado, trote, gimnasio e id inexistente.
- [x] Check-in: dos escalas obligatorias, opcionales plegados, precarga sin sobrescribir cambios del usuario, guardado y errores conservando el formulario. Verificar tres toques, actividad suelta y parámetros faltantes.
- [x] Semana: navegación, tira, propuesta y acciones, volumen, historial y estados vacíos. Verificar aceptación, cambios y navegación histórica.
- [x] Evidencia: capturas mock de 390 px de cada pantalla y estado; ejecutar typecheck, lint y tests. Revisar diff para asegurar que no se modificaron rutas protegidas; abrir PR con checklist literal por plano y limitaciones.

Foco de revisión: fechas que cruzan de mes; nulos en datos reales; recuperación anterior; formulario editado mientras llega la sesión; errores de escritura sin perder selecciones. La tira recibe doneDots opcional, derivado de los estados existentes, para opacidad. Diferencia documentada sin inventar campos de datos.

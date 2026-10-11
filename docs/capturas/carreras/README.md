# Carreras — verificación mock

Capturas de Expo web a 390 × 844. Datos ficticios de los hooks mock.

| Pantalla / caso | Captura |
| --- | --- |
| Temporada, dos próximas y tres corridas | [temporada.jpg](temporada.jpg) |
| Resumen, logística tildada | [resumen.jpg](resumen.jpg) |
| Agua estimada y nota | [perfil-estimado.jpg](perfil-estimado.jpg) |
| Altimetría y puestos sin dato | [perfil-sin-dato-altimetria.jpg](perfil-sin-dato-altimetria.jpg) |
| Río Claro: agua sin dato | [perfil-rio-claro.jpg](perfil-rio-claro.jpg) |
| Clima y preparación específica | [clima-preparacion.jpg](clima-preparacion.jpg) |
| Modo día por deep link | [modo-dia.jpg](modo-dia.jpg) |
| Modo día: caché con error de lectura | [modo-dia-offline.jpg](modo-dia-offline.jpg) |
| Entrada automática el día de carrera | [modo-dia-automatico.jpg](modo-dia-automatico.jpg) |
| Registro completado / fallo | [registro.jpg](registro.jpg), [registro-error.jpg](registro-error.jpg) |
| Carrera pasada | [carrera-pasada.jpg](carrera-pasada.jpg) |
| Perfil vacío | [perfil-vacio.jpg](perfil-vacio.jpg) |
| Temporada vacía / cargando / error | [temporada-vacia.jpg](temporada-vacia.jpg), [temporada-cargando.jpg](temporada-cargando.jpg), [temporada-error.jpg](temporada-error.jpg) |
| Detalle cargando / error / inexistente / offline | [detalle-cargando.jpg](detalle-cargando.jpg), [detalle-error.jpg](detalle-error.jpg), [carrera-no-encontrada.jpg](carrera-no-encontrada.jpg), [resumen-offline.jpg](resumen-offline.jpg) |

## Reproducir

Desde `expo/`, iniciar con `EXPO_PUBLIC_DATA_MODE=mock npx expo start --web`.
Abrir `/carreras`, tocar Cerro Azul, cambiar Resumen/Perfil y entrar al modo día.
El enlace `/carrera/race-next-oly?modo=dia` abre directamente ese modo.
Tildar kit y viaje, recargar y comprobar que los tildes siguen ahí.
En Río Claro, tocar «Ya me inscribí» y comprobar «Inscripto».

Las capturas de estados usan un arnés temporal, fuera de las rutas de producción:
copiar `expo/scripts/fixtures/carreras-capture.tsx.txt` a
`expo/app/race-capture.tsx` y eliminar esa copia al terminar. No cambia `expo/data/`.
La fixture prepara la consulta `races` de TanStack Query y monta las pantallas
reales, que siguen leyendo sus hooks. Abrir `/race-capture?state=<estado>` para
temporada; agregar `&screen=detail&id=race-next-oly` para el detalle.
Estados: `empty`, `loading`, `error`, `offline`, `today`.
Para modo día offline agregar `&modo=dia`. Para fallo de registro usar
`state=register-error&screen=detail&id=race-next-703` y tocar el botón.
Recargar una ruta normal al finalizar para limpiar las opciones y el fallo
inyectado. El escenario se limita a mock y no representa datos personales.

## Checklist de los planos

- [x] Dos próximas (Cerro Azul a 21 días, A, Inscripto; Río Claro A, Sin inscribir)
  y tres corridas, ordenadas por los hooks.
- [x] 10K Nocturno «sin dato», Bahía Serena 1:17:10 y «con tramo suspendido».
- [x] Línea de tiempo, prioridades, navegación de próximas y pasadas.
- [x] Cerro Azul: logística persistida al recargar, web y estrategia en viñetas.
- [x] Río Claro: registro con loading, éxito y mensaje de fallo.
- [x] Dos altimetrías SVG, agua estimada con nota, fuentes oficial/medido/estimado.
- [x] Río Claro: agua «sin dato» y pronóstico visible.
- [x] Tres bandas de clima; Cuestas cortas y Bici + trote con su para qué.
- [x] Modo día sin tarjetas, tipografía grande, botón, deep link, cierre y entrada
  automática; reapertura automática limitada a una por carrera/día con AsyncStorage.
- [x] Caché con error conserva contenido y muestra el aviso específico del modo día.
- [x] Carrera pasada sin cuenta regresiva y con enlace al trofeo.
- [x] Capturas de pantallas y estados vacíos/cargando/error/offline.
- [ ] Ronda 8 en iOS: comprobar que la pantalla sigue encendida y que, tras cargar
  la carrera, cerrar/reabrir la app en modo avión conserva el detalle y modo día.
  `useKeepAwake` y la caché persistida existente están integrados; la evidencia web
  de error con caché no sustituye esta prueba física.

## Diferencias y preguntas para el PR

- El contrato exige `date: string` y el mock no incluye una carrera sin fecha.
  ¿Qué campo y texto debe usar una carrera «por definir»? No se inventó un valor.
- El plano exige las sesiones etiquetadas de esta semana para la próxima carrera;
  se muestran también cuando su fecha ya pasó. El contrato no tiene `race_id` en
  sesiones para asociarlas a otra carrera.
- Modo día usa `Colors.background` y las cinco primeras viñetas de `strategy_md`,
  como el plano. Nutrición, transiciones y techos solo aparecen si el coach los
  escribió en esas viñetas; no existen campos específicos en el contrato actual.
- El escenario disponible tiene Cerro Azul y Río Claro. Canyon Lake y datos reales
  del Prompt 5 no se verificaron ni modificaron desde esta tarea de interfaz.
- No hay comando ni definición de «R» en el repo. La ronda 8 queda indicada en el
  PR para la revisión de Claude, sin afirmar que fue ejecutada.

Validación: `npm run typecheck`, `npm run lint`, `npm test`. Lint tiene 13 avisos
preexistentes en las pantallas/componentes viejos, cero errores.

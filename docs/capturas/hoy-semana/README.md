# Capturas · Hoy y Semana

Mock web · 390 × 844 px · America/Chicago · 11 de octubre de 2026. Capturas directas del navegador, sin retoque. Las pantallas largas tienen una captura inicial y otra desplazada a la sección relevante.

## Reproducir

Iniciar Expo desde expo/ con EXPO_PUBLIC_DATA_MODE=mock npx expo start --web. Usar un navegador de QA con viewport de 390 × 844 px.

El script expo/scripts/verify-ui.cjs usa Playwright desde una instalación externa (o el runtime de Codex); no agrega dependencias al proyecto. Configurar TRITRACK_PLAYWRIGHT_MODULE con la ruta del módulo y, opcionalmente, TRITRACK_BROWSER_CHANNEL (por defecto msedge). Ejecutar node scripts/verify-ui.cjs con Expo abierto en el puerto 8081, en modo desarrollo con recarga habilitada.

El script agrega un puente temporal al layout exclusivamente durante QA y lo restaura en finally. Inyecta estados en el cache de TanStack y rechazos de las acciones mock para verificar loading/error/offline; los componentes siguen consumiendo sus hooks. No modifica expo/data/. Los escenarios se aíslan limpiando el almacenamiento del contexto de navegador creado para QA.

Las capturas de desconexión ejercitan error + datos en cache. El mock trabaja en memoria: apagar la red no provoca errores en él. La conectividad real y la persistencia de Supabase corresponden a la capa de datos existente.

## Galería

### hoy

<details>
<summary>hoy cargando</summary>

![hoy-cargando](hoy-cargando.png)

</details>

<details>
<summary>hoy checkin guardado</summary>

![hoy-checkin-guardado](hoy-checkin-guardado.png)

</details>

<details>
<summary>hoy descanso sin whoop</summary>

![hoy-descanso-sin-whoop](hoy-descanso-sin-whoop.png)

</details>

<details>
<summary>hoy error</summary>

![hoy-error](hoy-error.png)

</details>

<details>
<summary>hoy normal</summary>

![hoy-normal](hoy-normal.png)

</details>

<details>
<summary>hoy recuperacion anterior sin datos</summary>

![hoy-recuperacion-anterior-sin-datos](hoy-recuperacion-anterior-sin-datos.png)

</details>

<details>
<summary>hoy sesiones</summary>

![hoy-sesiones](hoy-sesiones.png)

</details>

<details>
<summary>hoy sin conexion</summary>

![hoy-sin-conexion](hoy-sin-conexion.png)

</details>

<details>
<summary>hoy sin semana</summary>

![hoy-sin-semana](hoy-sin-semana.png)

</details>


### sesion

<details>
<summary>sesion cargando</summary>

![sesion-cargando](sesion-cargando.png)

</details>

<details>
<summary>sesion error</summary>

![sesion-error](sesion-error.png)

</details>

<details>
<summary>sesion gimnasio</summary>

![sesion-gimnasio](sesion-gimnasio.png)

</details>

<details>
<summary>sesion hecha sin actividad</summary>

![sesion-hecha-sin-actividad](sesion-hecha-sin-actividad.png)

</details>

<details>
<summary>sesion inexistente</summary>

![sesion-inexistente](sesion-inexistente.png)

</details>

<details>
<summary>sesion nado real</summary>

![sesion-nado-real](sesion-nado-real.png)

</details>

<details>
<summary>sesion nado</summary>

![sesion-nado](sesion-nado.png)

</details>

<details>
<summary>sesion salteada</summary>

![sesion-salteada](sesion-salteada.png)

</details>

<details>
<summary>sesion sin conexion</summary>

![sesion-sin-conexion](sesion-sin-conexion.png)

</details>

<details>
<summary>sesion sin disciplina sin pasos</summary>

![sesion-sin-disciplina-sin-pasos](sesion-sin-disciplina-sin-pasos.png)

</details>

<details>
<summary>sesion trote real</summary>

![sesion-trote-real](sesion-trote-real.png)

</details>

<details>
<summary>sesion trote</summary>

![sesion-trote](sesion-trote.png)

</details>


### checkin

<details>
<summary>checkin actividad</summary>

![checkin-actividad](checkin-actividad.png)

</details>

<details>
<summary>checkin cargando sesion</summary>

![checkin-cargando-sesion](checkin-cargando-sesion.png)

</details>

<details>
<summary>checkin desplegada</summary>

![checkin-desplegada](checkin-desplegada.png)

</details>

<details>
<summary>checkin error guardar</summary>

![checkin-error-guardar](checkin-error-guardar.png)

</details>

<details>
<summary>checkin error sesion</summary>

![checkin-error-sesion](checkin-error-sesion.png)

</details>

<details>
<summary>checkin guardando</summary>

![checkin-guardando](checkin-guardando.png)

</details>

<details>
<summary>checkin plegada</summary>

![checkin-plegada](checkin-plegada.png)

</details>

<details>
<summary>checkin precargada</summary>

![checkin-precargada](checkin-precargada.png)

</details>

<details>
<summary>checkin sin parametros</summary>

![checkin-sin-parametros](checkin-sin-parametros.png)

</details>


### semana

<details>
<summary>semana aceptada</summary>

![semana-aceptada](semana-aceptada.png)

</details>

<details>
<summary>semana anterior</summary>

![semana-anterior](semana-anterior.png)

</details>

<details>
<summary>semana cambios pedidos</summary>

![semana-cambios-pedidos](semana-cambios-pedidos.png)

</details>

<details>
<summary>semana cargando</summary>

![semana-cargando](semana-cargando.png)

</details>

<details>
<summary>semana error aceptar</summary>

![semana-error-aceptar](semana-error-aceptar.png)

</details>

<details>
<summary>semana error cambios</summary>

![semana-error-cambios](semana-error-cambios.png)

</details>

<details>
<summary>semana error</summary>

![semana-error](semana-error.png)

</details>

<details>
<summary>semana futura vacia</summary>

![semana-futura-vacia](semana-futura-vacia.png)

</details>

<details>
<summary>semana historial error</summary>

![semana-historial-error](semana-historial-error.png)

</details>

<details>
<summary>semana historial</summary>

![semana-historial](semana-historial.png)

</details>

<details>
<summary>semana pedir cambios</summary>

![semana-pedir-cambios](semana-pedir-cambios.png)

</details>

<details>
<summary>semana propuesta</summary>

![semana-propuesta](semana-propuesta.png)

</details>

<details>
<summary>semana sin conexion</summary>

![semana-sin-conexion](semana-sin-conexion.png)

</details>

<details>
<summary>semana vacia</summary>

![semana-vacia](semana-vacia.png)

</details>

<details>
<summary>semana volumen vacio z2 sin dato</summary>

![semana-volumen-vacio-z2-sin-dato](semana-volumen-vacio-z2-sin-dato.png)

</details>


### carreras

<details>
<summary>carreras</summary>

![carreras](carreras.png)

</details>


### trofeos

<details>
<summary>trofeos</summary>

![trofeos](trofeos.png)

</details>


### ruta

<details>
<summary>ruta inexistente</summary>

![ruta-inexistente](ruta-inexistente.png)

</details>

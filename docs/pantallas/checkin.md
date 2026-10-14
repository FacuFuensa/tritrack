# Check-in

## 1. Para qué existe

Después de entrenar, contarle al coach cómo fue **hablando**: tocar el
micrófono, decir cómo se sintió (piernas, energía, molestias, qué comió, por
qué cambió algo) y guardar. Escribir obliga a resumir; el audio no. El iPhone
pasa el audio a texto (dictado de Apple, `expo-speech-recognition`), la app
sube el audio y guarda el texto en `checkins.transcripcion`. El coach lo lee
entero el domingo.

Si dos entrenamientos se hicieron uno atrás del otro, va **un solo audio para
los dos**: una fila de `checkins` por sesión, con el mismo texto y el mismo
`audio_path`.

## 2. Ruta y cómo se llega

- Archivo: `expo/app/checkin.tsx` (formSheet del Stack raíz).
- Parámetros, uno de los tres:
  - `session`: una sesión del plan ("¿Cómo te fue?" de la tarjeta, Sesión,
    notificación).
  - `sessions`: varias sesiones separadas por coma. Lo usa el botón
    **"Contale al coach cómo te fue"** de Hoy, debajo de las tarjetas: cubre
    todas las sesiones de hoy que no son descanso ni salteadas.
  - `activity`: `external_id` de Strava sin sesión.
- La grabación vive en `expo/utils/useVoiceRecorder.ts`; el botón animado en
  `expo/components/RecordButton.tsx`.

## 3. Layout

```
¿Cómo te fue hoy?                      (una sesión: ¿Cómo te fue en <título>?)
MIÉ 14 OCT
(● Nado continuo) (● Trote suave)      chips solo si son varias sesiones
Piernas, energía, si algo molestó, qué comiste, por qué cambiaste algo.
El domingo el coach lo lee entero.

                 (( 🎙 ))               botón de 96, azul; grabando: rojo con
           Tocá y contá cómo te sentiste   dos anillos que laten y un halo que
                                           sigue el volumen de la voz
┌───────────────────────────────────┐
│ lo que vas diciendo, en vivo…     │  editable al terminar
└───────────────────────────────────┘
[              Guardar              ]
```

## 4. Estados

| Estado | Qué se ve |
|---|---|
| Sin grabar | Micrófono azul, **"Tocá y contá cómo te sentiste"**, link **"Prefiero escribirlo"** |
| Preparando | **"Preparando el micrófono…"** |
| Grabando | Botón rojo con cuadrado (parar), anillos, **"Grabando · 0:12"** en rojo (los primeros segundos, **"Grabando…"**); el texto aparece en vivo |
| Pasando a texto | **"Pasando a texto…"** |
| Listo | **"Audio de 0:48 listo"** y **"Grabar de nuevo"**; el texto se puede corregir |
| Sin permiso | **"TriTrack no tiene permiso para el micrófono. Activalo en Ajustes › TriTrack, o escribilo abajo."** y aparece el cuadro de texto |
| Dictado no disponible / se cortó | Aviso en rojo y cuadro de texto |
| Ya tiene check-in | **"Ya cargaste uno. Si guardás de nuevo, vale el último."**, texto precargado |
| Guardar | Deshabilitado sin texto o mientras graba |
| Error al guardar | **"No se pudo guardar. Revisá la conexión y probá de nuevo."** |
| Sin parámetros | `EmptyState` **"No sé de qué entrenamiento es"** / **"Cerrar"** |

## 5. Datos

- Idioma: `es-AR` si el iPhone lo tiene; si hay un español descargado para
  dictado sin conexión, transcribe en el teléfono (sin el límite de un minuto
  del servidor de Apple).
- Audio: WAV/CAF 16 kHz 16 bits (~2 MB por minuto) a
  `checkins-audio/<user_id>/<fecha>.caf`, privado.
- `rpe` y `energia` quedan `null`: el coach los infiere del texto.
- En web (modo mock) se transcribe con el dictado del navegador y no se
  guarda el archivo.

## 6. Checklist de aceptación

- [ ] En Hoy, debajo de las tarjetas, está **"Contale al coach cómo te fue"**;
      con dos sesiones dice **"Un audio para todos los entrenamientos de hoy."**
- [ ] Tocar el micrófono pide permiso, anima y muestra el texto en vivo.
- [ ] Parar, corregir, Guardar: la hoja se cierra y las dos tarjetas muestran
      el texto con un micrófono chico.
- [ ] Sin permiso de micrófono se puede escribir y guardar igual.

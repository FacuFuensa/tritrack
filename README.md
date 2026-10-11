# TriTrack

App de iOS para registrar entrenamientos de triatlón: nado, bici y trote, más
suplementos y recuperación. Hecha con Expo (SDK 54) y Expo Router; el código
está en [`expo/`](expo). Se distribuye por TestFlight.

Por ahora no tiene backend: sin `EXPO_PUBLIC_SUPABASE_URL` y
`EXPO_PUBLIC_SUPABASE_ANON_KEY` abre directo, sin login, y guarda todo en el
teléfono.

## Correrla en local

```bash
cd expo
npm install
npm run web
```

Antes de subir algo: `npm run typecheck` y `npm run lint`.

## Sacar un build a TestFlight

Para cambios nativos (dependencias con código nativo, Info.plist, ícono, SDK):

```bash
gh workflow run build-ios.yml -f submit=true
```

Compila con `eas build --local` en un runner `macos-26` de GitHub y lo sube con
`eas submit`. Entre 15 y 40 minutos después de la subida aparece en
TestFlight. Detalles en [`.github/workflows/build-ios.yml`](.github/workflows/build-ios.yml).

## Sacar un update por aire (OTA)

Para cambios que son solo JavaScript/TypeScript:

```bash
gh workflow run update-ota.yml -f mensaje="Qué cambia"
```

Publica con `eas update` en el canal `production` y llega a los teléfonos que
ya tienen un build con la misma versión de `expo/app.json`. Detalles en
[`.github/workflows/update-ota.yml`](.github/workflows/update-ota.yml).

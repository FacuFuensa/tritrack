# TriTrack

App de iOS para registrar entrenamientos de triatlón: nado, bici y trote, más
suplementos y recuperación. Hecha con Expo (SDK 54) y Expo Router; el código
está en [`expo/`](expo). Se distribuye por TestFlight.

El backend es Supabase (proyecto `training-coach`): las Edge Functions y las
migraciones están en [`supabase/`](supabase). La app inicia sesión una vez con
email y contraseña; Strava y Whoop se conectan desde **Ajustes** (el engranaje
de la pestaña principal) y el OAuth lo hace la función `oauth`: la app no lleva
ningún secreto. Sin `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`
abre en modo local, sin login (ver `expo/.env.example`).

## Correrla en local

```bash
cd expo
npm install
npm run web
```

Antes de subir algo: `npm run typecheck` y `npm run lint`, y los tests de las
funciones:

```bash
cd supabase/functions
deno test
```

Las funciones se despliegan con el conector de Supabase (`deploy_edge_function`)
o con `npx supabase functions deploy <nombre>` si la CLI tiene acceso al
proyecto. `verify_jwt` vive en `supabase/config.toml`.

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

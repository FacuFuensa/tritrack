# AGENTS.md — reglas para agentes que construyen pantallas

## Qué es esta app

TriTrack es una app de iOS (Expo SDK 54, Expo Router 6, React Native 0.81)
para entrenar triatlón: muestra el plan de la semana que escribe un coach,
lo que se hizo de verdad (Strava), la recuperación (Whoop), las carreras y los
trofeos. El código de la app está en `expo/`.

Vos construís **pantallas**. Los datos ya están resueltos: hay hooks listos en
`expo/data/` (contrato en [`docs/contratos.md`](docs/contratos.md)) y los
planos de cada pantalla van a estar en `docs/pantallas/`. Si un plano y el
código no coinciden, manda el plano; si algo falta, preguntá en el PR en vez
de inventarlo.

## Cómo correrla (modo mock, sin backend)

```bash
cd expo
npm install
EXPO_PUBLIC_DATA_MODE=mock npx expo start --web
```

En modo mock la app abre sin login y todos los hooks leen de
`expo/data/mocks/scenario.ts`: una semana propuesta con 8 sesiones (hoy, una
hecha con check-in y otra sin), recuperación, 3 carreras pasadas (una con el
nado suspendido, otra sin tiempo) y 2 futuras con perfil y clima. Las acciones
(Aceptar, check-in, "Ya me inscribí") funcionan en memoria.

## Lo que NO se toca

Estas rutas son de otro equipo. Un PR desde una rama `codex/…` que las toque
falla en CI (`.github/workflows/guard.yml`) y no se puede mergear:

- `expo/data/` — hooks, tipos, cálculos y mocks
- `supabase/` — base de datos y Edge Functions
- `.github/` — workflows
- `expo/app.json` y `expo/eas.json` — configuración del build

Tampoco:

- **No agregues dependencias con código nativo** (cualquier cosa que necesite
  `pod install` o un build nuevo). Solo JS puro. Si una pantalla necesita algo
  nativo, avisá en el PR. Lo que ya está en `expo/package.json` se puede usar.
- No pongas secretos ni datos personales: el repo es público.
- No escribas a Supabase directo desde una pantalla: todo pasa por los hooks.

## Cómo se ve

- Colores: siempre de `expo/constants/colors.ts` (`Colors.background`,
  `Colors.swim`, `Colors.bike`, `Colors.run`, `Colors.textSecondary`, …).
  Nada de hex sueltos.
- Tarjetas: `expo/components/GlassCard.tsx` (con `accentColor` para la
  disciplina).
- Calendario semanal: `expo/components/WeekCalendar.tsx`.
- Datos que faltan: nunca `0:00`, `NaN` ni `undefined` en pantalla. Se muestra
  "sin dato", "suspendido" o "estimado", según el plano. Los hooks devuelven
  `null` cuando no hay dato.

## Idioma

Todo texto de la interfaz va en **español rioplatense** (vos, "tocá",
"cargá", "entrenamiento", "trote", "bici", "nado"). Nada en inglés en la UI.

## Antes de abrir el PR

Desde `expo/`, tienen que pasar los tres:

```bash
npm run typecheck && npm run lint && npm test
```

Y el PR trae **capturas de cada pantalla que tocaste, en modo mock**
(incluidos los estados vacío, cargando y error si el plano los pide).

## Ramas

Trabajá en ramas `codex/<algo>`. Un PR por pantalla o por grupo chico de
pantallas.

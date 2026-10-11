import { assertEquals } from "jsr:@std/assert@1";
import { clampDays, disciplineOf, localDate, toActivityRow } from "./mapping.ts";

// Forma mínima de una actividad de /athlete/activities.
const base = {
  id: 1234567890,
  name: "Fondo",
  sport_type: "Run",
  type: "Run",
  start_date: "2026-10-11T04:30:00Z",
  start_date_local: "2026-10-10T23:30:00Z",
  distance: 10012.4,
  moving_time: 3013,
  elapsed_time: 3100,
  average_heartrate: 151.6,
  max_heartrate: 172.2,
  average_watts: undefined,
  total_elevation_gain: 41.3,
};

Deno.test("23:30 hora local que en UTC ya es el día siguiente → queda en el día local", () => {
  assertEquals(localDate(base), "2026-10-10");
  assertEquals(toActivityRow("u1", base).date, "2026-10-10");
});

Deno.test("una carrera en otra zona horaria usa su propia hora local", () => {
  // 7:00 en Arizona (UTC-7) = 14:00 UTC, mismo día; 00:15 en Nueva York = 04:15 UTC.
  assertEquals(localDate({ start_date: "2026-11-01T04:15:00Z", start_date_local: "2026-11-01T00:15:00Z" }), "2026-11-01");
  assertEquals(localDate({ start_date: "2026-11-01T14:00:00Z", start_date_local: "2026-11-01T07:00:00Z" }), "2026-11-01");
});

Deno.test("sin start_date_local cae a la fecha de America/Chicago", () => {
  assertEquals(localDate({ start_date: "2026-10-11T04:30:00Z" }), "2026-10-10");
});

Deno.test("disciplinas mapeadas", () => {
  const cases: [string, string][] = [
    ["Ride", "bike"], ["VirtualRide", "bike"], ["GravelRide", "bike"],
    ["Run", "run"], ["TrailRun", "run"],
    ["Swim", "swim"],
    ["WeightTraining", "gym"], ["Workout", "gym"],
    ["Walk", "other"], ["Yoga", "other"], ["Hike", "other"],
  ];
  for (const [sport, disc] of cases) assertEquals(disciplineOf({ sport_type: sport }), disc, sport);
  // Actividades viejas sin sport_type: se usa type.
  assertEquals(disciplineOf({ type: "Ride" }), "bike");
  assertEquals(disciplineOf({}), "other");
});

Deno.test("fila de activities completa, con raw y números enteros donde la columna es int", () => {
  const row = toActivityRow("u1", base);
  assertEquals(row, {
    user_id: "u1",
    source: "strava",
    external_id: "1234567890",
    date: "2026-10-10",
    started_at: "2026-10-11T04:30:00Z",
    sport: "Run",
    discipline: "run",
    distance_m: 10012.4,
    moving_s: 3013,
    elapsed_s: 3100,
    avg_hr: 152,
    max_hr: 172,
    avg_watts: null,
    elev_m: 41.3,
    raw: base,
  });
});

Deno.test("days: default 14, máximo 90, mínimo 1", () => {
  assertEquals(clampDays(undefined), 14);
  assertEquals(clampDays("x"), 14);
  assertEquals(clampDays(30), 30);
  assertEquals(clampDays(365), 90);
  assertEquals(clampDays(0), 1);
  assertEquals(clampDays(7.6), 8);
});

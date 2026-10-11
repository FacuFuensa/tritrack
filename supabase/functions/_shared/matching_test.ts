import { assertEquals } from "jsr:@std/assert@1";
import { matchActivity, type MatchableSession } from "./matching.ts";
import { localDate } from "../strava-sync/mapping.ts";

const ses = (id: string, discipline: string, dur_min?: number, extra: Partial<MatchableSession> = {}): MatchableSession => ({
  id, discipline, status: "planned", activity_id: null,
  prescription: dur_min == null ? {} : { dur_min }, ...extra,
});

Deno.test("dos bicis el mismo día: cada actividad va a la de duración más parecida", () => {
  const day = [ses("corta", "bike", 45), ses("larga", "bike", 180)];
  const largaReal = { external_id: "a1", discipline: "bike", moving_s: 170 * 60 };
  const m1 = matchActivity(largaReal, day);
  assertEquals(m1?.id, "larga");
  m1!.activity_id = "a1";

  const cortaReal = { external_id: "a2", discipline: "bike", moving_s: 50 * 60 };
  assertEquals(matchActivity(cortaReal, day)?.id, "corta");
});

Deno.test("actividad sin sesión de esa disciplina: no matchea", () => {
  const day = [ses("s1", "swim", 45), ses("g1", "gym", 60)];
  assertEquals(matchActivity({ external_id: "a", discipline: "run", moving_s: 1800 }, day), null);
  assertEquals(matchActivity({ external_id: "a", discipline: "run", moving_s: 1800 }, []), null);
});

Deno.test("brick acepta bici y trote", () => {
  const day = [ses("b", "brick", 90)];
  assertEquals(matchActivity({ external_id: "x", discipline: "bike", moving_s: 3600 }, day)?.id, "b");
  assertEquals(matchActivity({ external_id: "y", discipline: "run", moving_s: 1200 }, day)?.id, "b");
  assertEquals(matchActivity({ external_id: "z", discipline: "swim", moving_s: 1200 }, day), null);
});

Deno.test("23:30 local cae en la fecha local, no en la de UTC", () => {
  const a = { start_date: "2026-10-11T04:30:00Z", start_date_local: "2026-10-10T23:30:00Z" };
  assertEquals(localDate(a), "2026-10-10");
  // Carrera en otro estado (Mountain, UTC-6): sigue mandando la hora local.
  assertEquals(localDate({ start_date: "2026-10-11T05:45:00Z", start_date_local: "2026-10-10T23:45:00Z" }), "2026-10-10");
});

Deno.test("nunca pisa una sesión marcada a mano como skipped", () => {
  const day = [ses("s", "run", 40, { status: "skipped" })];
  assertEquals(matchActivity({ external_id: "a", discipline: "run", moving_s: 2400 }, day), null);
});

Deno.test("una sesión con actividad no se reasigna; la misma actividad vuelve a su sesión", () => {
  const day = [ses("s", "run", 40, { activity_id: "viejo", status: "done" })];
  assertEquals(matchActivity({ external_id: "nuevo", discipline: "run", moving_s: 2400 }, day), null);
  assertEquals(matchActivity({ external_id: "viejo", discipline: "run", moving_s: 2400 }, day)?.id, "s");
});

Deno.test("sin duración planeada igual matchea por disciplina", () => {
  assertEquals(matchActivity({ external_id: "a", discipline: "swim", moving_s: null }, [ses("s", "swim")])?.id, "s");
});

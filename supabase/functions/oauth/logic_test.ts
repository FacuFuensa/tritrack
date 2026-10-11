import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  appRedirect,
  authorizeUrl,
  callbackUrl,
  checkState,
  isProvider,
  newNonce,
  parseRoute,
  STATE_TTL_MS,
} from "./logic.ts";

const BASE = "https://ufxkutmjhivtiqewitrt.supabase.co";
const NONCE = "0123456789abcdef0123456789abcdef";

Deno.test("URL de Strava: endpoint mobile, scopes y redirect del contrato C1", () => {
  const url = new URL(authorizeUrl("strava", "12345", NONCE, BASE));
  assertEquals(url.origin + url.pathname, "https://www.strava.com/oauth/mobile/authorize");
  assertEquals(url.searchParams.get("client_id"), "12345");
  assertEquals(url.searchParams.get("response_type"), "code");
  assertEquals(url.searchParams.get("approval_prompt"), "auto");
  assertEquals(url.searchParams.get("scope"), "read,activity:read_all");
  assertEquals(
    url.searchParams.get("redirect_uri"),
    "https://ufxkutmjhivtiqewitrt.supabase.co/functions/v1/oauth/callback/strava",
  );
  assertEquals(url.searchParams.get("state"), NONCE);
});

Deno.test("URL de Whoop: endpoint OAuth2, scopes con offline y redirect del contrato C1", () => {
  const url = new URL(authorizeUrl("whoop", "abc-def", NONCE, BASE));
  assertEquals(url.origin + url.pathname, "https://api.prod.whoop.com/oauth/oauth2/auth");
  assertEquals(url.searchParams.get("client_id"), "abc-def");
  assertEquals(url.searchParams.get("response_type"), "code");
  assertEquals(
    url.searchParams.get("scope"),
    "offline read:recovery read:sleep read:workout read:cycles read:profile",
  );
  assertEquals(
    url.searchParams.get("redirect_uri"),
    "https://ufxkutmjhivtiqewitrt.supabase.co/functions/v1/oauth/callback/whoop",
  );
  assertEquals(url.searchParams.get("state"), NONCE);
});

Deno.test("el redirect es idéntico al que se usa en el intercambio del código", () => {
  for (const p of ["strava", "whoop"] as const) {
    const url = new URL(authorizeUrl(p, "x", NONCE, BASE));
    assertEquals(url.searchParams.get("redirect_uri"), callbackUrl(p, BASE));
  }
});

Deno.test("nonce: 32 hex y distinto cada vez", () => {
  const a = newNonce(), b = newNonce();
  assert(/^[0-9a-f]{32}$/.test(a), a);
  assert(a !== b);
});

Deno.test("proveedor inválido", () => {
  assert(isProvider("strava"));
  assert(isProvider("whoop"));
  assert(!isProvider("garmin"));
  assert(!isProvider(""));
  assert(!isProvider(undefined));
  assertEquals(parseRoute("GET", "/oauth/callback/garmin"), {
    kind: "callback",
    provider: null,
  });
});

Deno.test("rutas: start, callback, disconnect y desconocidas", () => {
  assertEquals(parseRoute("POST", "/oauth/start"), { kind: "start" });
  assertEquals(parseRoute("POST", "/functions/v1/oauth/start"), { kind: "start" });
  assertEquals(parseRoute("POST", "/oauth/disconnect"), { kind: "disconnect" });
  assertEquals(parseRoute("GET", "/oauth/callback/strava"), {
    kind: "callback",
    provider: "strava",
  });
  assertEquals(parseRoute("GET", "/oauth/callback/whoop/"), {
    kind: "callback",
    provider: "whoop",
  });
  assertEquals(parseRoute("GET", "/oauth/start"), { kind: "unknown" });
  assertEquals(parseRoute("POST", "/oauth"), { kind: "unknown" });
});

const NOW = Date.parse("2026-10-11T12:00:00Z");
const row = (minutesAgo: number, provider = "strava") => ({
  user_id: "u1",
  provider,
  created_at: new Date(NOW - minutesAgo * 60_000).toISOString(),
});

Deno.test("nonce vigente → devuelve el usuario", () => {
  assertEquals(checkState(row(3), "strava", NOW), { ok: true, userId: "u1" });
});

Deno.test("nonce vencido (más de 10 min) → state_expired", () => {
  assertEquals(checkState(row(11), "strava", NOW), { ok: false, error: "state_expired" });
  // Justo en el borde todavía vale.
  const edge = { ...row(0), created_at: new Date(NOW - STATE_TTL_MS).toISOString() };
  assertEquals(checkState(edge, "strava", NOW), { ok: true, userId: "u1" });
});

Deno.test("nonce inexistente → state_not_found", () => {
  assertEquals(checkState(null, "strava", NOW), { ok: false, error: "state_not_found" });
});

Deno.test("nonce de otro proveedor → state_mismatch", () => {
  assertEquals(checkState(row(1, "whoop"), "strava", NOW), {
    ok: false,
    error: "state_mismatch",
  });
});

Deno.test("deep link de vuelta a la app (C1)", () => {
  assertEquals(appRedirect("strava", true), "tritrack://oauth?provider=strava&ok=1");
  assertEquals(
    appRedirect("whoop", false, "token_exchange"),
    "tritrack://oauth?provider=whoop&ok=0&error=token_exchange",
  );
  // Proveedor inválido: sin provider, igual vuelve a la app.
  assertEquals(
    appRedirect(null, false, "invalid_provider"),
    "tritrack://oauth?ok=0&error=invalid_provider",
  );
});

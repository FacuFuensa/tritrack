// Lógica pura del OAuth: armar URLs, validar el state, rutear. Sin red ni
// base, para que `deno test` la cubra entera.

export type Provider = "strava" | "whoop";

// El nonce de oauth_states vence a los 10 minutos (contrato C3).
export const STATE_TTL_MS = 10 * 60_000;

const AUTHORIZE: Record<Provider, { url: string; scope: string; extra?: Record<string, string> }> = {
  // El endpoint /mobile/ abre la app de Strava si está instalada; si no, la web.
  strava: {
    url: "https://www.strava.com/oauth/mobile/authorize",
    scope: "read,activity:read_all",
    extra: { approval_prompt: "auto" },
  },
  whoop: {
    url: "https://api.prod.whoop.com/oauth/oauth2/auth",
    scope: "offline read:recovery read:sleep read:workout read:cycles read:profile",
  },
};

export function isProvider(p: unknown): p is Provider {
  return p === "strava" || p === "whoop";
}

// Contrato C1. Tiene que ser idéntica en el authorize y en el intercambio del
// código: Whoop compara carácter por carácter.
export function callbackUrl(provider: Provider, supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/oauth/callback/${provider}`;
}

export function authorizeUrl(
  provider: Provider,
  clientId: string,
  nonce: string,
  supabaseUrl: string,
): string {
  const a = AUTHORIZE[provider];
  const url = new URL(a.url);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  for (const [k, v] of Object.entries(a.extra ?? {})) url.searchParams.set(k, v);
  url.searchParams.set("scope", a.scope);
  url.searchParams.set("redirect_uri", callbackUrl(provider, supabaseUrl));
  url.searchParams.set("state", nonce);
  return url.toString();
}

export function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type StateRow = { user_id: string; provider: string; created_at: string };
export type StateCheck =
  | { ok: true; userId: string }
  | { ok: false; error: "state_not_found" | "state_expired" | "state_mismatch" };

export function checkState(row: StateRow | null, provider: Provider, now: number): StateCheck {
  if (!row) return { ok: false, error: "state_not_found" };
  if (now - Date.parse(row.created_at) > STATE_TTL_MS) return { ok: false, error: "state_expired" };
  if (row.provider !== provider) return { ok: false, error: "state_mismatch" };
  return { ok: true, userId: row.user_id };
}

export type Route =
  | { kind: "start" }
  | { kind: "disconnect" }
  | { kind: "callback"; provider: Provider | null }
  | { kind: "unknown" };

// El gateway entrega el path con el nombre de la función adelante
// ("/oauth/start"); se mira solo el final para no depender de eso.
export function parseRoute(method: string, pathname: string): Route {
  const path = pathname.replace(/\/+$/, "");
  if (method === "POST" && /\/start$/.test(path)) return { kind: "start" };
  if (method === "POST" && /\/disconnect$/.test(path)) return { kind: "disconnect" };
  const cb = path.match(/\/callback\/([^/]+)$/);
  if (method === "GET" && cb) return { kind: "callback", provider: isProvider(cb[1]) ? cb[1] : null };
  return { kind: "unknown" };
}

// Deep link de vuelta a la app (contrato C1).
export function appRedirect(provider: Provider | null, ok: boolean, error?: string): string {
  const q = new URLSearchParams();
  if (provider) q.set("provider", provider);
  q.set("ok", ok ? "1" : "0");
  if (!ok && error) q.set("error", error);
  return `tritrack://oauth?${q}`;
}

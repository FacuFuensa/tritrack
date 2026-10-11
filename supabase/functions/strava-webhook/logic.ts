// Partes puras del webhook de Strava, para `deno test`.

// El verify_token de la suscripción. Si no hay secreto STRAVA_VERIFY_TOKEN,
// se deriva de NOTIFY_SECRET (que ya existe en las funciones y en Vault):
// sha256("strava-webhook:" + NOTIFY_SECRET), 32 hex. Así se puede registrar
// la suscripción desde SQL sin cargar otro secreto a mano.
export async function expectedVerifyToken(env: { STRAVA_VERIFY_TOKEN?: string; NOTIFY_SECRET?: string }) {
  if (env.STRAVA_VERIFY_TOKEN) return env.STRAVA_VERIFY_TOKEN;
  if (!env.NOTIFY_SECRET) return null;
  const bytes = new TextEncoder().encode(`strava-webhook:${env.NOTIFY_SECRET}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...hash].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

// GET de verificación: responde {"hub.challenge"} si el token coincide.
export function verifyChallenge(params: URLSearchParams, expected: string | null): string | null {
  if (!expected) return null;
  if (params.get("hub.mode") !== "subscribe") return null;
  if (params.get("hub.verify_token") !== expected) return null;
  return params.get("hub.challenge");
}

export type StravaEvent = { activityId: string; athleteId: number };

// Solo interesa activity/create. El resto (update, delete, athlete) se ignora.
export function parseEvent(body: unknown): StravaEvent | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (b.object_type !== "activity" || b.aspect_type !== "create") return null;
  const id = b.object_id, owner = b.owner_id;
  if ((typeof id !== "number" && typeof id !== "string") || typeof owner !== "number") return null;
  return { activityId: String(id), athleteId: owner };
}

// "¿Cómo te fue en …?" con el título de la sesión o, sin sesión, el nombre de
// la actividad. Deep link de C1.
export function checkinNotification(
  session: { id: string; title: string | null } | null,
  activity: { external_id: string; name: string | null },
) {
  const what = session?.title?.trim() || activity.name?.trim() || "tu entrenamiento";
  const url = session
    ? `tritrack://checkin?session=${encodeURIComponent(session.id)}`
    : `tritrack://checkin?activity=${encodeURIComponent(activity.external_id)}`;
  return { title: `¿Cómo te fue en ${what}?`, body: "Contame en tres toques.", url };
}

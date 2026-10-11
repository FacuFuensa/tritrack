// Lógica pura de notify: armar los mensajes de Expo Push y leer qué tokens
// murieron. Sin red, para que `deno test` la cubra.

export type Payload = { title: string; body: string; url?: string };

export function parsePayload(input: unknown): Payload | null {
  if (!input || typeof input !== "object") return null;
  const { title, body, url } = input as Record<string, unknown>;
  if (typeof title !== "string" || !title || typeof body !== "string" || !body) return null;
  const p: Payload = { title, body };
  // Solo deep links de la app: la notificación no abre la web.
  if (typeof url === "string" && url.startsWith("tritrack://")) p.url = url;
  return p;
}

export function buildMessages(tokens: string[], p: Payload) {
  return tokens.map((to) => ({
    to,
    title: p.title,
    body: p.body,
    sound: "default",
    data: p.url ? { url: p.url } : {},
  }));
}

type Ticket = { status?: string; details?: { error?: string } };

// Expo devuelve un ticket por mensaje, en el mismo orden.
export function deadTokens(tokens: string[], tickets: Ticket[] | undefined): string[] {
  if (!Array.isArray(tickets)) return [];
  return tokens.filter((_, i) =>
    tickets[i]?.status === "error" && tickets[i]?.details?.error === "DeviceNotRegistered"
  );
}

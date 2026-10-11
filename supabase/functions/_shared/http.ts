// Piezas comunes de las funciones que llama la app: CORS, JSON, cliente admin
// y quién llama (JWT del usuario o el secreto compartido de notify).
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notify-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// verify_jwt=false en el gateway: el JWT se valida acá con getUser.
export async function userFromJwt(admin: SupabaseClient, req: Request): Promise<string | null> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data, error } = await admin.auth.getUser(jwt);
  return error || !data.user ? null : data.user.id;
}

// Comparación en tiempo constante del header x-notify-secret.
export function hasNotifySecret(req: Request): boolean {
  const expected = Deno.env.get("NOTIFY_SECRET") ?? "";
  const got = req.headers.get("x-notify-secret") ?? "";
  if (!expected || got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

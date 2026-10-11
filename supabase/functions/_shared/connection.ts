// Conexión rota sin cambiar el esquema de *_tokens: el refresh token murió
// (revocado desde la web del proveedor, o rotado y perdido). No se borra la
// fila a ciegas; se marca en `scope` y la app lo muestra en rojo con
// "Reconectar". El próximo OAuth hace upsert y pisa la marca.
export const REAUTH_PREFIX = "reauth:";

export function isBroken(scope: string | null | undefined): boolean {
  return (scope ?? "").startsWith(REAUTH_PREFIX);
}

export function brokenScope(scope: string | null | undefined): string {
  return isBroken(scope) ? scope! : `${REAUTH_PREFIX}${scope ?? ""}`;
}

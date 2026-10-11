export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  // Vuelta del OAuth (tritrack://oauth?...): normalmente la atrapa
  // openAuthSessionAsync; si llega suelta, se muestra Ajustes con el estado.
  if (path.includes('oauth')) return '/ajustes';
  if (path.includes('ajustes') || path.includes('account') || path.includes('auth')) {
    console.log('[NativeIntent] Passing through deep link:', path);
    return path;
  }
  if (initial) {
    return '/';
  }
  return path;
}

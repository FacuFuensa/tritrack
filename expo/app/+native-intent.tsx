export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes('oauth')) return '/ajustes';
  return path;
}

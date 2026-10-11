/** Presentación del plan; los datos de carrera siguen viniendo de useRace. */
export async function firstRaceDayVisit(id: string, date: string, storage: {
  getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void>;
}): Promise<boolean> {
  const key = `carrera-dia:${id}`;
  if (await storage.getItem(key) === date) return false;
  await storage.setItem(key, date);
  return true;
}

export function startCountdown(date: string, time: string | null, now: Date): string | null {
  if (!time) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [h, min, sec = 0] = time.split(':').map(Number);
  const minutes = Math.ceil((new Date(y, m - 1, d, h, min, sec).getTime() - now.getTime()) / 60000);
  if (!Number.isFinite(minutes)) return null;
  if (minutes <= 0) return '¡A correr!';
  return minutes < 60 ? `Faltan ${minutes} min` : `Faltan ${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60}` : ''}`;
}

export function strategyBullets(md: string | null): string[] {
  return (md ?? '').split('\n').filter(line => /^\s*(?:[-*+] |\d+\. )/.test(line))
    .slice(0, 5).map(line => line.replace(/^\s*(?:[-*+] |\d+\. )/, '').replace(/\*\*/g, '').trim());
}

export function elevationGeometry(input: [number, number][]) {
  const points = input.filter(([km, m]) => Number.isFinite(km) && Number.isFinite(m));
  if (!points.length) return null;
  const start = Math.min(...points.map(p => p[0]));
  const distance = Math.max(...points.map(p => p[0]));
  const min = Math.min(...points.map(p => p[1]));
  const max = Math.max(...points.map(p => p[1]));
  const coordinates = points.map(([km, m]) => `${12 + (km - start) / (distance - start || 1) * 296},${112 - (m - min) / (max - min || 1) * 96}`);
  return { line: coordinates.join(' '), area: `${coordinates[0].split(',')[0]},120 ${coordinates.join(' ')} ${coordinates.at(-1)!.split(',')[0]},120`, min, max, distance };
}

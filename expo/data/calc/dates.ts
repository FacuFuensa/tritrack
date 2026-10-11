// Fechas como texto AAAA-MM-DD, siempre en la zona del atleta. Nada de
// new Date('AAAA-MM-DD') suelto: eso es medianoche UTC y en Chicago cae el
// día anterior.

export const TIME_ZONE = 'America/Chicago';

/** Hoy (o el instante dado) como AAAA-MM-DD en America/Chicago. */
export function todayLocal(now: Date = new Date(), timeZone = TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

// Aritmética de calendario sobre UTC puro: no hay horario de verano que la
// corra un día.
function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  return fromUtc(toUtc(date) + n * 86_400_000);
}

/** Días de calendario de `from` a `to` (negativo si `to` ya pasó). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/** Lunes de la semana de `date` (las semanas del plan empiezan el lunes). */
export function mondayOf(date: string): string {
  const dow = new Date(toUtc(date)).getUTCDay(); // 0 = domingo
  return addDays(date, -((dow + 6) % 7));
}

/** Los 7 días de la semana que empieza en `monday`. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

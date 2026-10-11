import type { Recovery, RecoveryLight } from '../types';
import type { RecoveryRow } from './rows.ts';

/** Semáforo de Whoop: ≥67 verde, 34-66 amarillo, ≤33 rojo. */
export function recoveryLight(pct: number | null): RecoveryLight | null {
  if (pct == null) return null;
  if (pct >= 67) return 'verde';
  if (pct >= 34) return 'amarillo';
  return 'rojo';
}

/** El dato más reciente hasta `date` inclusive (Whoop a veces llega tarde). */
export function latestRecovery(rows: RecoveryRow[], date: string): Recovery | null {
  const row = rows.filter((r) => r.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
  return row ? { ...row, light: recoveryLight(row.recovery_pct) } : null;
}

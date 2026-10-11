import { IntegrationType, ImportedWorkout } from '@/constants/types';

// La conexión con Strava y Whoop (OAuth y sincronización) vive en el backend
// desde la próxima versión: la app no lleva credenciales de OAuth.

export function isDuplicateWorkout(
  existing: ImportedWorkout[],
  newWorkout: ImportedWorkout
): boolean {
  return existing.some(
    (w) => w.sourceId === newWorkout.sourceId && w.source === newWorkout.source
  );
}

export function getIntegrationDisplayName(type: IntegrationType): string {
  switch (type) {
    case 'strava': return 'Strava';
    case 'whoop': return 'WHOOP';
  }
}

export function getRecoveryIntensitySuggestion(recoveryScore: number): string {
  if (recoveryScore >= 80) return 'High intensity recommended';
  if (recoveryScore >= 50) return 'Moderate intensity recommended';
  return 'Low intensity / recovery day recommended';
}

export function getIntegrationStatusLabel(status: string, error?: string): string {
  switch (status) {
    case 'connected': return 'Connected';
    case 'connecting': return 'Connecting...';
    case 'syncing': return 'Syncing...';
    case 'error': return error ? `Error: ${error}` : 'Error';
    case 'needs_reauth': return 'Needs Re-authorization';
    case 'not_available': return 'Not Available';
    case 'disconnected': return 'Not Connected';
    default: return 'Unknown';
  }
}

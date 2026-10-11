// useRaceActions (C5): lo único que la app escribe de una carrera (spec §4):
// "Ya me inscribí", la foto de la medalla y un resultado cargado a mano.
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { keys } from './keys';
import type { RaceResult } from './types';

export function useRaceActions() {
  const qc = useQueryClient();
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: keys.races }), [qc]);

  const markRegistered = useCallback(async (id: string) => {
    await api.updateRace(id, { status: 'registered' });
    await refresh();
  }, [refresh]);

  // localUri: lo que devuelve expo-image-picker (file://…).
  const setMedal = useCallback(async (id: string, localUri: string) => {
    const path = await api.uploadMedal(id, localUri);
    await api.updateRace(id, { medal_path: path });
    await refresh();
  }, [refresh]);

  // Un resultado manual deja la carrera como terminada.
  const saveManualResult = useCallback(async (id: string, result: RaceResult) => {
    await api.updateRace(id, { result: { ...result, source: result.source || 'manual' }, status: 'done' });
    await qc.invalidateQueries();
  }, [qc]);

  return { markRegistered, setMedal, saveManualResult };
}

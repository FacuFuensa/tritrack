// useWeekActions (C5): Aceptar y Pedir cambios sobre una semana propuesta.
// La app solo toca plan_weeks.status y feedback (spec §4).
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export function useWeekActions() {
  const qc = useQueryClient();

  const accept = useCallback(async (weekId: string) => {
    await api.setWeekStatus(weekId, 'accepted');
    await qc.invalidateQueries();
  }, [qc]);

  const requestChanges = useCallback(async (weekId: string, feedback: string) => {
    await api.setWeekStatus(weekId, 'changes_requested', feedback.trim());
    await qc.invalidateQueries();
  }, [qc]);

  return { accept, requestChanges };
}

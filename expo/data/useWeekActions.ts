// useWeekActions (C5): Aceptar y Pedir cambios sobre una semana propuesta, y
// mover una sesión de día. La app solo toca plan_weeks.status y feedback, y
// plan_sessions.status y date (spec §4).
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { mondayOf } from './calc/dates';
import { keys } from './keys';
import type { WeekData } from './types';

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

  // Optimista: la tarjeta queda en el día nuevo apenas se suelta. Si falla, se
  // vuelve a pedir la semana y la sesión regresa a su día.
  const moveSession = useCallback(async (sessionId: string, date: string) => {
    const key = keys.week(mondayOf(date));
    await qc.cancelQueries({ queryKey: key });
    qc.setQueryData<WeekData>(key, (old) => old && {
      ...old,
      sessions: old.sessions.map((s) => (s.id === sessionId ? { ...s, date } : s)),
    });
    try {
      await api.moveSession(sessionId, date);
    } finally {
      await qc.invalidateQueries();
    }
  }, [qc]);

  return { accept, requestChanges, moveSession };
}

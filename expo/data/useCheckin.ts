// useCheckin (C5): guarda el check-in de una sesión o de una actividad suelta.
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { CheckinInput } from './types';

export function useCheckin() {
  const qc = useQueryClient();

  const submit = useCallback(async (input: CheckinInput) => {
    if (!input.session_id && !input.activity_id) throw new Error('Falta la sesión o la actividad.');
    await api.insertCheckin(input);
    await qc.invalidateQueries();
  }, [qc]);

  return { submit };
}

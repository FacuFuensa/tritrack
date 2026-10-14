// useCheckin (C5): guarda el check-in de una sesión o de una actividad suelta.
// submitVoice sube un solo audio y deja una fila por sesión que cubre.
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { CheckinInput, VoiceCheckinInput } from './types';

export function useCheckin() {
  const qc = useQueryClient();

  const submit = useCallback(async (input: CheckinInput) => {
    if (!input.session_id && !input.activity_id) throw new Error('Falta la sesión o la actividad.');
    await api.insertCheckin(input);
    await qc.invalidateQueries();
  }, [qc]);

  const submitVoice = useCallback(async ({ date, targets, transcripcion, audioUri, audio_s }: VoiceCheckinInput) => {
    if (!targets.length) throw new Error('Falta la sesión o la actividad.');
    const audio_path = audioUri ? await api.uploadCheckinAudio(audioUri) : undefined;
    for (const t of targets) await api.insertCheckin({ date, ...t, transcripcion, audio_path, audio_s });
    await qc.invalidateQueries();
  }, [qc]);

  return { submit, submitVoice };
}

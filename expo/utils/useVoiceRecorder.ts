// Graba un audio y lo pasa a texto en el teléfono (dictado de Apple, o el del
// navegador en web). Devuelve el texto, el archivo y cuánto duró.
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

export type RecorderState = 'idle' | 'starting' | 'recording' | 'stopping' | 'done';
export type RecorderError = 'permiso' | 'no-disponible' | 'fallo';

// El rioplatense primero; si el iPhone tiene otro español descargado, ese
// transcribe en el teléfono, sin el límite de un minuto del servidor de Apple.
const CANDIDATES = ['es-AR', 'es-419', 'es-US', 'es-MX', 'es-ES'];

async function pickLocale(): Promise<{ lang: string; onDevice: boolean }> {
  if (Platform.OS === 'web') return { lang: 'es-AR', onDevice: false };
  try {
    const { locales, installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
    const installed = CANDIDATES.find((l) => installedLocales.includes(l));
    if (installed && ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) return { lang: installed, onDevice: true };
    return { lang: CANDIDATES.find((l) => locales.includes(l)) ?? 'es-ES', onDevice: false };
  } catch {
    return { lang: 'es-AR', onDevice: false };
  }
}

export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<RecorderError | null>(null);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [volume, setVolume] = useState(0); // 0..1
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const failed = useRef(false);

  const stopTimer = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };

  useSpeechRecognitionEvent('start', () => {
    setState('recording');
    startedAt.current = Date.now();
    stopTimer();
    timer.current = setInterval(() => setSeconds(Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000)), 250);
  });
  // En modo continuo cada resultado final es un tramo nuevo: se concatenan.
  useSpeechRecognitionEvent('result', (e) => {
    const t = e.results[0]?.transcript ?? '';
    if (e.isFinal) { setFinalText((prev) => [prev, t.trim()].filter(Boolean).join(' ')); setInterim(''); }
    else setInterim(t);
  });
  useSpeechRecognitionEvent('volumechange', (e) => setVolume(Math.max(0, Math.min(1, e.value / 10))));
  useSpeechRecognitionEvent('audioend', (e) => { if (e.uri) setAudioUri(e.uri); });
  useSpeechRecognitionEvent('end', () => {
    stopTimer();
    if (startedAt.current) setSeconds(Math.round((Date.now() - startedAt.current) / 1000));
    setVolume(0);
    // Si quedó un parcial sin cerrar (se cortó a mitad de frase), se guarda igual.
    setInterim((rest) => { if (rest.trim()) setFinalText((prev) => [prev, rest.trim()].filter(Boolean).join(' ')); return ''; });
    // Si falló antes de grabar algo, se vuelve al principio.
    setState(failed.current && !startedAt.current ? 'idle' : 'done');
  });
  useSpeechRecognitionEvent('error', (e) => {
    if (e.error === 'aborted' || e.error === 'no-speech') return;
    failed.current = true;
    if (e.error === 'not-allowed') startedAt.current = null;
    setError(e.error === 'not-allowed' ? 'permiso' : e.error === 'service-not-allowed' || e.error === 'language-not-supported' ? 'no-disponible' : 'fallo');
  });

  const start = useCallback(async () => {
    setError(null); failed.current = false; startedAt.current = null;
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) { setError('no-disponible'); return; }
    setState('starting');
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) { setState('idle'); setError('permiso'); return; }
    setFinalText(''); setInterim(''); setAudioUri(null); setSeconds(0);
    const { lang, onDevice } = await pickLocale();
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
      requiresOnDeviceRecognition: onDevice,
      iosTaskHint: 'dictation',
      volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      // 16 kHz, 16 bits: ~2 MB por minuto, sobra para la voz.
      recordingOptions: { persist: true, outputSampleRate: 16000, outputEncoding: 'pcmFormatInt16' },
    });
  }, []);

  const stop = useCallback(() => { setState('stopping'); ExpoSpeechRecognitionModule.stop(); }, []);

  const reset = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
    stopTimer();
    setState('idle'); setError(null); setFinalText(''); setInterim(''); setAudioUri(null); setSeconds(0); setVolume(0);
  }, []);

  const text = [finalText, interim.trim()].filter(Boolean).join(' ');
  return { state, error, text, volume, audioUri, seconds, start, stop, reset };
}

import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CircleHelp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSession } from '@/data/useSession';
import { useToday } from '@/data/useToday';
import { useCheckin } from '@/data/useCheckin';
import { todayLocal } from '@/data/calc/dates';
import { disciplineName, fmtDate } from '@/utils/format';
import { useVoiceRecorder } from '@/utils/useVoiceRecorder';
import type { SessionView } from '@/data/types';
import Colors from '@/constants/colors';
import RecordButton from '@/components/RecordButton';
import DisciplineDot from '@/components/DisciplineDot';
import PrimaryButton from '@/components/PrimaryButton';
import EmptyState from '@/components/EmptyState';
import common from '@/components/screenStyles';

const errors = {
  permiso: 'TriTrack no tiene permiso para el micrófono. Activalo en Ajustes › TriTrack, o escribilo abajo.',
  'no-disponible': 'El dictado no está disponible en este teléfono ahora. Escribilo abajo.',
  fallo: 'Se cortó la grabación. Lo que dijiste quedó: tocá el micrófono para seguir desde ahí.',
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const nameOf = (s: SessionView) => s.title ?? disciplineName(s.discipline);

// Check-in por audio. ?session=<id> (una sesión), ?sessions=<id>,<id> (varias
// del mismo día, un solo audio) o ?activity=<external_id> (actividad suelta).
export default function Checkin() {
  const { session, sessions, activity } = useLocalSearchParams<{ session?: string; sessions?: string; activity?: string }>();
  const ids = sessions ? sessions.split(',').filter(Boolean) : session ? [session] : [];
  const { data: single } = useSession(ids.length === 1 ? ids[0] : '');
  const { data: today } = useToday();
  const covered: SessionView[] = ids.length === 1 ? (single ? [single] : []) : (today?.sessions ?? []).filter(s => ids.includes(s.id));
  const { submitVoice } = useCheckin();
  const rec = useVoiceRecorder();
  const [text, setText] = useState(''), [writing, setWriting] = useState(false);
  const [saving, setSaving] = useState(false), [failed, setFailed] = useState(false);
  const loaded = useRef(false);
  // Borrador en el teléfono: si la app se cierra a mitad de la grabación, al
  // volver está lo que dijiste y se sigue desde ahí.
  const draftKey = `checkin-borrador:${ids.join(',') || activity || ''}`;
  const [draft, setDraft] = useState<{ text: string; seconds: number } | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(draftKey).then(raw => {
      const d = raw ? JSON.parse(raw) : null;
      if (active) setDraft(d && typeof d.text === 'string' && d.text.trim() ? { text: d.text, seconds: Number(d.seconds) || 0 } : null);
    }).catch(() => { if (active) setDraft(null); });
    return () => { active = false; };
  }, [draftKey]);

  const previous = covered.find(s => s.checkin)?.checkin;
  const previousText = previous?.transcripcion ?? previous?.nota ?? '';
  useEffect(() => {
    if (loaded.current || draft === undefined) return;
    if (draft) { loaded.current = true; setText(draft.text); setWriting(true); return; }
    if (!previous) return;
    loaded.current = true;
    if (previousText) { setText(previousText); setWriting(true); }
  }, [draft, previous, previousText]);
  // Lo que se dicta va al cuadro de texto; después se puede corregir a mano.
  useEffect(() => { if (rec.text) setText(rec.text); }, [rec.text]);
  useEffect(() => { if (rec.error) setWriting(true); }, [rec.error]);

  const recording = rec.state === 'recording' || rec.state === 'starting';
  // Segundos ya grabados: los de esta vez o los del borrador que quedó.
  const soFar = rec.state === 'done' ? rec.seconds : rec.state === 'idle' ? draft?.seconds ?? 0 : rec.seconds;
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    if (draft === undefined || !loaded.current && !text) return;
    const t = text.trim();
    const value = t && t !== previousText.trim() ? JSON.stringify({ text, seconds: soFar }) : null;
    writes.current = writes.current.then(() => value ? AsyncStorage.setItem(draftKey, value) : AsyncStorage.removeItem(draftKey)).catch(() => {});
  }, [text, soFar, draft, draftKey, previousText]);
  const clearDraft = () => { setDraft(null); writes.current = writes.current.then(() => AsyncStorage.removeItem(draftKey)).catch(() => {}); };
  const busy = rec.state === 'starting' || rec.state === 'stopping';
  const close = () => router.canGoBack() ? router.back() : router.replace('/hoy');
  const date = covered[0]?.date ?? todayLocal();

  async function save() {
    const t = text.trim();
    if (!t || saving || recording || busy) return;
    setSaving(true); setFailed(false);
    try {
      const targets = ids.length ? ids.map(session_id => ({ session_id })) : [{ activity_id: activity! }];
      const audioUri = rec.state === 'done' ? rec.audioUri : null;
      await submitVoice({ date, targets, transcripcion: t, audioUri, audio_s: audioUri && soFar > 0 ? soFar : undefined });
      clearDraft();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); close();
    } catch { setFailed(true); }
    finally { setSaving(false); }
  }

  if (!ids.length && !activity) return <SafeAreaView style={styles.screen}><EmptyState icon={CircleHelp} title="No sé de qué entrenamiento es" actionLabel="Cerrar" onAction={close} /></SafeAreaView>;
  const title = covered.length === 1 ? `¿Cómo te fue en ${nameOf(covered[0])}?` : covered.length > 1 ? '¿Cómo te fue hoy?' : activity ? '¿Cómo te fue en tu entrenamiento?' : '¿Cómo te fue?';
  const resumable = !!text.trim() && text.trim() !== previousText.trim();
  const status = rec.state === 'starting' ? 'Preparando el micrófono…' : rec.state === 'recording' ? (rec.seconds > 0 ? `Grabando · ${mmss(rec.seconds)}` : 'Grabando…') : rec.state === 'stopping' ? 'Pasando a texto…' : resumable ? (soFar > 0 ? `Llevás ${mmss(soFar)} · tocá para seguir` : 'Tocá para seguir grabando') : rec.state === 'done' ? 'Audio listo' : 'Tocá y contá cómo te sentiste';
  const showText = writing || rec.state !== 'idle';

  return <SafeAreaView edges={['top', 'bottom']} style={styles.screen}><KeyboardAvoidingView behavior="padding" style={common.flex}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Text style={styles.title}>{title}</Text><Text style={styles.date}>{fmtDate(date).toUpperCase()}</Text>
    {covered.length > 1 && <View style={styles.chips}>{covered.map(s => <View key={s.id} style={styles.chip}>{s.discipline && <DisciplineDot discipline={s.discipline} />}<Text style={styles.chipText}>{nameOf(s)}</Text></View>)}</View>}
    {previous && <Text style={[common.secondary, { marginBottom: 8 }]}>Ya cargaste uno. Si guardás de nuevo, vale el último.</Text>}
    <Text style={common.secondary}>Piernas, energía, si algo molestó, qué comiste, por qué cambiaste algo. El domingo el coach lo lee entero.</Text>
    <View style={styles.recorder}>
      <RecordButton recording={recording} busy={busy} volume={rec.volume} resume={resumable} onPress={() => { if (recording) rec.stop(); else { void rec.start(resumable ? text : '', resumable ? soFar : 0); } }} />
      <Text style={[styles.status, recording && { color: Colors.danger }]}>{status}</Text>
      {!recording && !busy && resumable && <Pressable accessibilityRole="button" onPress={() => { rec.reset(); setText(''); setWriting(false); clearDraft(); }}><Text style={common.action}>Borrar y empezar de cero</Text></Pressable>}
      {rec.error && <Text style={[common.error, styles.center]}>{errors[rec.error]}</Text>}
    </View>
    {showText ? <TextInput accessibilityLabel="Lo que le contás al coach" placeholder={recording ? 'Te escucho…' : 'Contale al coach cómo te fue…'} placeholderTextColor={Colors.textTertiary} multiline editable={!recording && !busy} value={text} onChangeText={setText} style={[common.input, styles.input, recording && styles.live]} />
      : <Pressable accessibilityRole="button" onPress={() => setWriting(true)}><Text style={[common.action, styles.center]}>Prefiero escribirlo</Text></Pressable>}
  </ScrollView><View style={styles.footer}><PrimaryButton label="Guardar" loading={saving} disabled={!text.trim() || recording || busy} onPress={() => { void save(); }} />{failed && <Text style={common.error}>No se pudo guardar. Revisá la conexión y probá de nuevo.</Text>}</View></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.backgroundLight }, content: { padding: 20, paddingBottom: 24 }, title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' }, date: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 16 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, borderRadius: 16, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.backgroundCard }, chipText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' }, recorder: { alignItems: 'center', marginVertical: 12 }, status: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 4 }, center: { textAlign: 'center' }, input: { minHeight: 140 }, live: { borderColor: Colors.danger + '60' }, footer: { padding: 20, borderTopWidth: 1, borderColor: Colors.cardBorder } });

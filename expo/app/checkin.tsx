import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, LayoutAnimation, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleHelp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSession } from '@/data/useSession';
import { useCheckin } from '@/data/useCheckin';
import { todayLocal } from '@/data/calc/dates';
import { disciplineName, fmtDate } from '@/utils/format';
import type { Molestia } from '@/data/types';
import Colors from '@/constants/colors';
import ScaleSelector from '@/components/ScaleSelector';
import PrimaryButton from '@/components/PrimaryButton';
import EmptyState from '@/components/EmptyState';
import common from '@/components/screenStyles';

const zones = ['Rodilla', 'Tobillo', 'Gemelo', 'Isquios', 'Cuádriceps', 'Cadera', 'Espalda baja', 'Hombro', 'Pie', 'Otra'];
export default function Checkin() {
  const { session, activity } = useLocalSearchParams<{ session?: string; activity?: string }>();
  const { data: s } = useSession(session ?? '');
  const { submit } = useCheckin();
  const [rpe, setRpe] = useState<number | null>(null), [energia, setEnergia] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false), [zona, setZona] = useState<string | null>(null), [nivel, setNivel] = useState<Molestia['nivel']>(1);
  const [geles, setGeles] = useState(0), [nota, setNota] = useState(''), [saving, setSaving] = useState(false), [failed, setFailed] = useState(false);
  const edited = useRef(false), loaded = useRef<string | null>(null);
  useEffect(() => {
    if (!s?.checkin || edited.current || loaded.current === s.checkin.id) return;
    loaded.current = s.checkin.id;
    setRpe(s.checkin.rpe); setEnergia(s.checkin.energia); setZona(s.checkin.molestia?.zona ?? null); setNivel(s.checkin.molestia?.nivel ?? 1); setGeles(s.checkin.nutricion?.geles ?? 0); setNota(s.checkin.nota ?? '');
  }, [s]);
  const close = () => router.canGoBack() ? router.back() : router.replace('/hoy');
  async function save() {
    if (rpe == null || energia == null || saving) return;
    setSaving(true); setFailed(false);
    try { await submit({ date: s?.date ?? todayLocal(), ...(session ? { session_id: session } : { activity_id: activity }), rpe, energia, molestia: zona ? { zona, nivel } : undefined, nutricion: geles > 0 ? { geles } : undefined, nota: nota.trim() || undefined }); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); close(); }
    catch { setFailed(true); }
    finally { setSaving(false); }
  }
  if (!session && !activity) return <SafeAreaView style={styles.screen}><EmptyState icon={CircleHelp} title="No sé de qué entrenamiento es" actionLabel="Cerrar" onAction={close} /></SafeAreaView>;
  return <SafeAreaView edges={['top', 'bottom']} style={styles.screen}><KeyboardAvoidingView behavior="padding" style={common.flex}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Text style={styles.title}>{session ? s ? `¿Cómo te fue en ${s.title ?? disciplineName(s.discipline)}?` : '¿Cómo te fue?' : '¿Cómo te fue en tu entrenamiento?'}</Text><Text style={styles.date}>{fmtDate(s?.date ?? todayLocal()).toUpperCase()}</Text>
    {s?.checkin && <Text style={[common.secondary, { marginBottom: 16 }]}>Ya cargaste uno. Si guardás de nuevo, vale el último.</Text>}
    <Text style={styles.question}>¿Qué tan duro fue?</Text><ScaleSelector values={[1,2,3,4,5,6,7,8,9,10]} value={rpe} onChange={n => { edited.current = true; setRpe(n); }} labels={{ 1: 'muy suave', 10: 'al máximo' }} />
    <Text style={styles.question}>¿Cómo estaba tu energía?</Text><ScaleSelector values={[1,2,3,4,5]} value={energia} onChange={n => { edited.current = true; setEnergia(n); }} color={Colors.recovery} labels={{ 1: 'vacío', 5: 'a tope' }} />
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(!expanded); }}><Text style={[common.action, { marginTop: 18 }]}>{expanded ? '▾ Ocultar' : '▸ Agregar molestia, geles o nota'}</Text></Pressable>
    {expanded && <View><Text style={styles.optionalLabel}>Molestia</Text><View style={styles.chips}>{[...zones, ...(zona && !zones.some(z => z.toLowerCase() === zona) ? [zona] : [])].map(z => <Pressable key={z} accessibilityRole="button" accessibilityState={{ selected: zona === z.toLowerCase() }} onPress={() => { edited.current = true; setZona(zona === z.toLowerCase() ? null : z.toLowerCase()); setNivel(1); }} style={[styles.chip, zona === z.toLowerCase() && styles.chipSelected]}><Text style={[styles.chipText, zona === z.toLowerCase() && { color: Colors.warning }]}>{z}</Text></Pressable>)}</View>{zona && <ScaleSelector values={[0,1,2,3]} value={nivel} color={Colors.warning} optionLabels={{ 0: 'nada', 1: 'tirante', 2: 'dolor', 3: 'calambre' }} onChange={n => { edited.current = true; setNivel(n as Molestia['nivel']); }} />}
    <View style={styles.gels}><Text style={styles.optionalLabel}>Geles</Text><View style={common.row}><Pressable accessibilityRole="button" accessibilityLabel="Menos geles" disabled={geles === 0} onPress={() => { edited.current = true; setGeles(Math.max(0, geles - 1)); }} style={styles.stepper}><Text style={common.title}>−</Text></Pressable><Text style={common.title}>{geles}</Text><Pressable accessibilityRole="button" accessibilityLabel="Más geles" disabled={geles === 6} onPress={() => { edited.current = true; setGeles(Math.min(6, geles + 1)); }} style={styles.stepper}><Text style={common.title}>+</Text></Pressable></View></View>
    <Text style={styles.optionalLabel}>Nota</Text><TextInput accessibilityLabel="Nota" placeholder="Algo que el coach tenga que saber…" placeholderTextColor={Colors.textTertiary} multiline numberOfLines={3} maxLength={280} value={nota} onChangeText={t => { edited.current = true; setNota(t); }} style={common.input} /></View>}
  </ScrollView><View style={styles.footer}><PrimaryButton label="Guardar" loading={saving} disabled={rpe == null || energia == null} onPress={() => { void save(); }} />{failed && <Text style={common.error}>No se pudo guardar. Revisá la conexión y probá de nuevo.</Text>}</View></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.backgroundLight }, content: { padding: 20, paddingBottom: 24 }, title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' }, date: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 16 }, question: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 14, marginTop: 18 }, optionalLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 10 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, chip: { height: 34, borderRadius: 17, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.backgroundCard }, chipSelected: { backgroundColor: Colors.warning + '25', borderColor: Colors.warning }, chipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' }, gels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 }, stepper: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: Colors.backgroundCard }, footer: { padding: 20, borderTopWidth: 1, borderColor: Colors.cardBorder } });

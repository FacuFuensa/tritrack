// Ejercicios de un día de gimnasio como checklist: tocás el ejercicio y queda
// hecho. La flechita al lado del nombre despliega variantes del mismo músculo
// para cambiarlo rápido si en el gimnasio terminaste haciendo otra cosa.
// Lo marcado y los cambios se guardan en el teléfono.
import React, { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import type { Exercise } from '@/data/types';
import Colors from '@/constants/colors';
import { alternativesFor, remember } from '@/utils/gymExercises';
import GlassCard from './GlassCard';
import s from './screenStyles';

type Saved = { done: number[]; swaps: Record<string, string> };
const HISTORY_KEY = 'gym:hechos';

export default React.memo(function GymChecklist({ sessionId, exercises, color }: { sessionId: string; exercises: Exercise[]; color: string }) {
  const key = `gym:${sessionId}`;
  const [saved, setSaved] = useState<Saved>({ done: [], swaps: {} });
  const [history, setHistory] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [storageError, setStorageError] = useState(false);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    setReady(false);
    setSaved({ done: [], swaps: {} });
    Promise.all([AsyncStorage.getItem(key), AsyncStorage.getItem(HISTORY_KEY)]).then(([raw, rawHistory]) => {
      if (!active) return;
      const value = raw ? JSON.parse(raw) : {};
      setSaved({ done: Array.isArray(value.done) ? value.done.filter((n: unknown) => typeof n === 'number') : [], swaps: value.swaps && typeof value.swaps === 'object' ? value.swaps : {} });
      const h = rawHistory ? JSON.parse(rawHistory) : [];
      setHistory(Array.isArray(h) ? h.filter((n: unknown) => typeof n === 'string') : []);
    }).catch(() => { if (active) setStorageError(true); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [key]);

  const persist = (next: Saved, nextHistory: string[]) => {
    setSaved(next);
    setHistory(nextHistory);
    setStorageError(false);
    writes.current = writes.current.then(() => AsyncStorage.multiSet([[key, JSON.stringify(next)], [HISTORY_KEY, JSON.stringify(nextHistory)]])).catch(() => { setStorageError(true); });
  };
  const nameAt = (i: number) => saved.swaps[i] ?? exercises[i].name;
  const toggle = (i: number) => {
    const isDone = saved.done.includes(i);
    void Haptics.impactAsync(isDone ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    persist({ ...saved, done: isDone ? saved.done.filter(n => n !== i) : [...saved.done, i] }, isDone ? history : remember(history, nameAt(i)));
  };
  const swap = (i: number, name: string) => {
    void Haptics.selectionAsync();
    const swaps = { ...saved.swaps };
    if (name === exercises[i].name) delete swaps[i]; else swaps[i] = name;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(null);
    persist({ ...saved, swaps }, saved.done.includes(i) ? remember(history, name) : history);
  };
  const toggleMenu = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(open === i ? null : i);
  };

  const doneCount = exercises.filter((_, i) => saved.done.includes(i)).length;
  return <>
    <View style={[s.spread, styles.header]}><Text style={[s.section, styles.flush]}>EJERCICIOS</Text>{ready && <Text style={[styles.count, doneCount === exercises.length && { color: Colors.success }]}>{doneCount === exercises.length ? '¡Listo!' : `${doneCount} de ${exercises.length}`}</Text>}</View>
    <GlassCard accentColor={color}>
      {exercises.map((ex, i) => {
        const name = nameAt(i), swapped = saved.swaps[i] != null, checked = saved.done.includes(i), expanded = open === i;
        const alt = expanded ? alternativesFor(name, history, swapped ? ex.name : undefined) : null;
        return <View key={i} style={[styles.item, i > 0 && styles.divider]}>
          <Pressable disabled={!ready} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: !ready }} accessibilityLabel={`${name}, ${ex.sets} × ${ex.reps}`} accessibilityHint={checked ? 'Tocá para desmarcarlo' : 'Tocá para marcarlo como hecho'} accessibilityActions={[{ name: 'activate' }, { name: 'cambiar', label: 'Cambiar por otro' }]} onAccessibilityAction={e => e.nativeEvent.actionName === 'cambiar' ? toggleMenu(i) : toggle(i)} onPress={() => toggle(i)} style={styles.row}>
            <View style={[styles.circle, checked && styles.circleOn]}>{checked && <Check size={16} color={Colors.background} />}</View>
            <View style={s.flex}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, checked && styles.nameDone]}>{name}</Text>
                <Pressable disabled={!ready} accessibilityRole="button" accessibilityLabel={`Cambiar ${name} por otro`} accessibilityState={{ expanded }} hitSlop={10} onPress={() => toggleMenu(i)} style={[styles.chevron, expanded && { backgroundColor: color + '20' }]}>
                  {expanded ? <ChevronUp size={18} color={color} /> : <ChevronDown size={18} color={Colors.textSecondary} />}
                </Pressable>
              </View>
              {swapped && <Text style={styles.instead}>en vez de {ex.name}</Text>}
              {!!ex.cue && !swapped && <Text style={styles.cue}>{ex.cue}</Text>}
            </View>
            <Text style={[styles.value, checked && styles.nameDone]}>{ex.sets} × {ex.reps}</Text>
          </Pressable>
          {alt && <View style={styles.menu}>
            {!alt.done.length && !alt.others.length ? <Text style={s.secondary}>No tengo variantes para este ejercicio.</Text> : <>
              {!!alt.done.length && <Options label="YA LOS HICISTE" names={alt.done} planned={swapped ? ex.name : undefined} color={color} onPick={n => swap(i, n)} />}
              {!!alt.others.length && <Options label={`OTROS DE ${(alt.group ?? '').toUpperCase()}`} names={alt.others} color={color} onPick={n => swap(i, n)} />}
            </>}
          </View>}
        </View>;
      })}
      {storageError && <Text style={s.error}>No se pudo guardar. Probá de nuevo.</Text>}
    </GlassCard>
  </>;
});

const Options = ({ label, names, planned, color, onPick }: { label: string; names: string[]; planned?: string; color: string; onPick: (name: string) => void }) => <View style={styles.group}>
  <Text style={styles.groupLabel}>{label}</Text>
  {names.map(n => <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Cambiar por ${n}`} onPress={() => onPick(n)} style={({ pressed }) => [styles.option, pressed && { backgroundColor: color + '20' }]}>
    <Text style={styles.optionText}>{n}</Text>{n === planned && <Text style={styles.planned}>del plan</Text>}
  </Pressable>)}
</View>;

const styles = StyleSheet.create({
  header: { marginRight: 20 },
  flush: { marginRight: 0 },
  count: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  item: { paddingVertical: 8 },
  divider: { borderTopWidth: 1, borderColor: Colors.cardBorder },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  circle: { width: 24, height: 24, borderWidth: 1.5, borderColor: Colors.textTertiary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  circleOn: { borderColor: Colors.success, backgroundColor: Colors.success },
  name: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  nameDone: { color: Colors.textSecondary, textDecorationLine: 'line-through' },
  instead: { color: Colors.textTertiary, fontSize: 12, fontWeight: '500', marginTop: 2 },
  chevron: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  value: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  cue: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', fontStyle: 'italic', marginTop: 2 },
  menu: { marginLeft: 36, marginTop: 8, padding: 8, borderRadius: 12, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.cardBorder, gap: 8 },
  group: { gap: 2 },
  groupLabel: { color: Colors.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 8, paddingTop: 4, paddingBottom: 2 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40, paddingHorizontal: 8, borderRadius: 8 },
  optionText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500', flexShrink: 1 },
  planned: { color: Colors.textTertiary, fontSize: 11, fontWeight: '700' },
});

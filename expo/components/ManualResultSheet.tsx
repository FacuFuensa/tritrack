import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { Race, RaceResult } from '@/data/types';
import { buildManualResult, parseTime, splitKeys, splitNames, suspendedNames, type ManualFields, type RankKey } from '@/utils/trophies';
import { fmtDate } from '@/utils/format';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';

export default React.memo(function ManualResultSheet({ races, onClose, onSave }: { races: Race[]; onClose: () => void; onSave: (id: string, result: RaceResult) => Promise<void> }) {
  const [id, setId] = useState(races[0]?.id ?? '');
  const [fields, setFields] = useState<ManualFields>({ total: ['', '', ''], splits: {}, cancelled: [], ranks: {}, division: '' });
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const selected = races.find(r => r.id === id);
  const tri = selected?.kind.startsWith('tri_');
  const result = buildManualResult({ ...fields, splits: tri ? fields.splits : {}, cancelled: tri ? fields.cancelled : [] });
  const invalidTime = parseTime(fields.total) === 'invalid' || (tri && splitKeys.some(k => !fields.cancelled.includes(k) && !!fields.splits[k] && parseTime(fields.splits[k]!.split(':')) === 'invalid'));
  async function save() {
    if (!result || !selected || saving) return;
    setSaving(true); setFailed(false);
    try { await onSave(id, result); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); onClose(); }
    catch { setFailed(true); }
    finally { setSaving(false); }
  }
  const rankInput = (key: RankKey, label: string) => <TextInput accessibilityLabel={label} style={[styles.input, styles.rank]} keyboardType="number-pad" value={fields.ranks[key] ?? ''} editable={!saving} onChangeText={value => setFields(f => ({ ...f, ranks: { ...f.ranks, [key]: value } }))} />;
  return <BottomSheet visible onClose={() => { if (!saving) onClose(); }} title="Cargar un resultado viejo">
    <Text style={styles.label}>Carrera</Text><View style={styles.chips}>{races.map(r => <Pressable key={r.id} accessibilityRole="button" accessibilityState={{ selected: id === r.id, disabled: saving }} disabled={saving} onPress={() => setId(r.id)} style={[styles.chip, id === r.id && styles.selected]}><Text style={styles.text}>{r.name} · {fmtDate(r.date)}</Text></Pressable>)}</View>
    <Text style={styles.label}>Tiempo total</Text><View style={styles.row}>{['h', 'mm', 'ss'].map((label, i) => <React.Fragment key={label}>{i > 0 && <Text style={styles.text}>:</Text>}<TextInput accessibilityLabel={`Tiempo total ${label}`} placeholder={label} placeholderTextColor={Colors.textTertiary} keyboardType="number-pad" style={[styles.input, styles.time]} value={fields.total[i]} editable={!saving} onChangeText={value => setFields(f => ({ ...f, total: f.total.map((v, index) => i === index ? value : v) }))} /></React.Fragment>)}</View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)} style={styles.toggle}><Text style={styles.link}>▸ Parciales y puestos (opcional)</Text></Pressable>
    {expanded && <View style={styles.optional}>
      {tri && <>{splitKeys.map(key => <View key={key} style={styles.between}><Text style={styles.text}>{splitNames[key]}</Text><TextInput accessibilityLabel={`Parcial ${splitNames[key]}`} placeholder="h:mm:ss" placeholderTextColor={Colors.textTertiary} keyboardType="numbers-and-punctuation" style={[styles.input, styles.split]} value={fields.splits[key] ?? ''} editable={!saving && !fields.cancelled.includes(key)} onChangeText={value => setFields(f => ({ ...f, splits: { ...f.splits, [key]: value } }))} /></View>)}
        {(['swim', 'bike', 'run'] as const).map(key => <View style={styles.between} key={key}><Text style={styles.text}>{suspendedNames[key]}</Text><Switch accessibilityLabel={suspendedNames[key]} disabled={saving} value={fields.cancelled.includes(key)} trackColor={{ true: Colors.accent, false: Colors.inputBackground }} onValueChange={value => setFields(f => ({ ...f, cancelled: value ? [...f.cancelled, key] : f.cancelled.filter(k => k !== key) }))} /></View>)}
      </>}
      <Text style={styles.label}>Puesto general</Text><View style={styles.row}>{rankInput('rank_overall', 'Puesto general')}<Text style={styles.text}>de</Text>{rankInput('field_overall', 'Total general')}</View>
      <Text style={styles.label}>Puesto categoría</Text><View style={styles.row}>{rankInput('rank_division', 'Puesto categoría')}<Text style={styles.text}>de</Text>{rankInput('field_division', 'Total categoría')}</View>
      <Text style={styles.label}>Categoría</Text><TextInput accessibilityLabel="Categoría" style={styles.input} value={fields.division} editable={!saving} onChangeText={division => setFields(f => ({ ...f, division }))} />
    </View>}
    {invalidTime && <Text style={styles.error}>Revisá el tiempo</Text>}
    {failed && <Text accessibilityRole="alert" style={styles.error}>No se pudo guardar. Probá de nuevo.</Text>}
    <PrimaryButton label="Guardar" disabled={!result || !selected} loading={saving} onPress={() => void save()} />
  </BottomSheet>;
});
const styles = StyleSheet.create({ label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 10 }, text: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, input: { backgroundColor: Colors.inputBackground, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, padding: 12, color: Colors.textPrimary, fontSize: 16 }, time: { width: 64, textAlign: 'center' }, rank: { width: 90 }, split: { width: 120 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }, chip: { borderRadius: 12, padding: 12, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.cardBorder }, selected: { borderColor: Colors.accent }, optional: { gap: 10, marginBottom: 20 }, toggle: { paddingVertical: 20 }, link: { color: Colors.accent, fontSize: 14, fontWeight: '600' }, error: { color: Colors.danger, fontSize: 12, fontWeight: '600', marginBottom: 14 } });

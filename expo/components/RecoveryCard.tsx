import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Recovery } from '@/data/types';
import Colors from '@/constants/colors';
import { fmtDate, fmtMinutes } from '@/utils/format';
import GlassCard from './GlassCard';
export default React.memo(function RecoveryCard({ recovery: r, today }: { recovery: Recovery | null; today: string }) {
  const color = r?.light === 'verde' ? Colors.success : r?.light === 'amarillo' ? Colors.warning : r?.light === 'rojo' ? Colors.danger : Colors.textTertiary;
  const metrics = r ? [r.hrv_ms == null ? null : `VFC ${r.hrv_ms} ms`, r.rhr_bpm == null ? null : `FC reposo ${r.rhr_bpm}`, r.sleep_h == null ? null : `Sueño ${fmtMinutes(r.sleep_h * 60)}`].filter(Boolean).join(' · ') : '';
  return <GlassCard accentColor={Colors.recovery}><View style={styles.row}><Text style={styles.label}>RECUPERACIÓN</Text>{r && (r.recovery_pct == null ? <Text style={styles.missing}>sin dato</Text> : <View style={styles.percent}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={[styles.number, { color }]}>{r.recovery_pct} %</Text></View>)}</View>{!r && <Text style={styles.empty}>Sin datos de Whoop todavía</Text>}{!!metrics && <Text style={styles.metrics}>{metrics}</Text>}{r && r.date < today && <Text style={styles.stale}>Dato del {fmtDate(r.date)}</Text>}</GlassCard>;
});
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' }, percent: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 10, height: 10, borderRadius: 5 }, number: { fontSize: 28, fontWeight: '800' }, missing: { color: Colors.textTertiary, fontSize: 15, fontWeight: '600' }, metrics: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 8 }, empty: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500', marginTop: 12 }, stale: { color: Colors.textTertiary, fontSize: 12, fontWeight: '500', marginTop: 8 } });

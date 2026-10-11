import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
export default React.memo(function ScaleSelector({ values, value, onChange, labels, color = Colors.accent, optionLabels }: { values: number[]; value: number | null; onChange: (n: number) => void; labels?: Record<number, string>; color?: string; optionLabels?: Record<number, string> }) {
  return <View><View style={styles.row}>{values.map(n => <Pressable key={n} accessibilityRole="button" accessibilityLabel={optionLabels?.[n] ?? String(n)} accessibilityState={{ selected: value === n }} onPress={() => { void Haptics.selectionAsync(); onChange(n); }} style={[styles.button, value === n && { backgroundColor: color }]}><Text style={[styles.number, optionLabels && styles.word]}>{optionLabels?.[n] ?? n}</Text></Pressable>)}</View>{labels && <View style={styles.labels}><Text style={styles.label}>{labels[values[0]]}</Text><Text style={styles.label}>{labels[values[values.length - 1]]}</Text></View>}</View>;
});
const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 4 }, button: { flex: 1, minWidth: 0, height: 44, borderRadius: 10, backgroundColor: Colors.backgroundCard, alignItems: 'center', justifyContent: 'center' }, number: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' }, word: { fontSize: 13, fontWeight: '600' }, labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, label: { color: Colors.textTertiary, fontSize: 11, fontWeight: '600' } });

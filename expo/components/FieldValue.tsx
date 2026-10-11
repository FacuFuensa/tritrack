import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Field } from '@/data/types';
import { fieldDisplay } from '@/data/calc/profile';
import Colors from '@/constants/colors';

export default React.memo(function FieldValue<T>({ label, field, format, stacked }: { label: string; field?: Field<T>; format?: (value: T) => string; stacked?: boolean }) {
  if (!field) return null;
  const display = fieldDisplay(field, format);
  const source = !display.missing && <Text style={[styles.source, display.estimated && styles.estimated]}>{display.source}</Text>;
  if (stacked) return <View style={styles.field}><Text style={styles.listLabel}>{label}</Text><Text style={[styles.text, styles.listText]}>{display.text}</Text>{source}{!!field.note && <Text style={styles.note}>{field.note}</Text>}</View>;
  return <View style={styles.field}><View style={styles.row}><Text style={styles.label}>{label}</Text>
    <View style={styles.value}><Text style={styles.text}>{display.text}</Text>{source}</View></View>
    {!!field.note && <Text style={styles.note}>{field.note}</Text>}</View>;
});
const styles = StyleSheet.create({ field: { paddingVertical: 8 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, listLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 8 }, listText: { textAlign: 'left', lineHeight: 24, marginBottom: 4 }, label: { flex: 1, color: Colors.textSecondary, fontSize: 14, fontWeight: '500' }, value: { flex: 1, alignItems: 'flex-end', gap: 4 }, text: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', textAlign: 'right' }, source: { color: Colors.textTertiary, fontSize: 11, fontWeight: '600' }, estimated: { color: Colors.warning, backgroundColor: Colors.warning + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }, note: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 } });

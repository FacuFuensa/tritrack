import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { weekDays } from '@/data/calc/dates';
import type { Discipline } from '@/data/types';
import DisciplineDot from './DisciplineDot';
export default React.memo(function WeekStrip({ monday, selected, today, dots, onSelect, doneDots }: { monday: string; selected: string | null; today: string; dots: Record<string, Discipline[]>; onSelect: (date: string) => void; doneDots?: Record<string, boolean[]> }) {
  return <View style={styles.strip}>{weekDays(monday).map((date, i) => <Pressable key={date} accessibilityRole="button" accessibilityLabel={date} accessibilityState={{ selected: date === selected }} onPress={() => onSelect(date)} style={[styles.day, date === today && styles.today, date === selected && styles.selected]}><Text style={styles.label}>{'LMXJVSD'[i]}</Text><Text style={styles.number}>{Number(date.slice(8))}</Text><View style={styles.dots}>{dots[date]?.slice(0, 3).map((d, j) => <View key={j} style={{ opacity: doneDots?.[date]?.[j] ? 1 : 0.4 }}><DisciplineDot discipline={d} size={5} /></View>)}</View></Pressable>)}</View>;
});
const styles = StyleSheet.create({ strip: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 16 }, day: { width: 38, paddingVertical: 8, borderRadius: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.background }, today: { borderColor: Colors.accent + '50' }, selected: { backgroundColor: Colors.accent }, label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' }, number: { color: Colors.textPrimary, fontSize: 17, fontWeight: '600' }, dots: { height: 5, flexDirection: 'row', gap: 3 } });

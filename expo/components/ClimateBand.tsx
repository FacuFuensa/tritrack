import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ClimateRow } from '@/data/types';
import Colors from '@/constants/colors';

const labels = { swim: 'NADO', bike: 'BICI', run: 'TROTE', race: 'CARRERA' };
export default React.memo(function ClimateBand({ row }: { row: ClimateRow }) {
  const color = row.segment === 'race' ? Colors.accent : Colors[row.segment];
  return <View style={[styles.band, { borderLeftColor: color }]}><Text style={styles.label}>{labels[row.segment]} · {row.hour_local}:00</Text>
    <View style={styles.row}><Text style={styles.median}>{row.temp_c_median ?? 'sin dato'} °C</Text><Text style={styles.detail}>{row.temp_c_min ?? 'sin dato'}–{row.temp_c_max ?? 'sin dato'} °C</Text></View>
    <Text style={styles.detail}>sensación máx {row.feels_max_c ?? 'sin dato'} °C</Text><Text style={styles.detail}>Llovió {row.rain_years ?? 'sin dato'} de {row.years ?? 'sin dato'} años</Text>
  </View>;
});
const styles = StyleSheet.create({ band: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, marginBottom: 12, gap: 4 }, row: { flexDirection: 'row', alignItems: 'baseline', gap: 12 }, label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' }, median: { color: Colors.textPrimary, fontSize: 30, fontWeight: '800' }, detail: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' } });

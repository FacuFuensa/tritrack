import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GearButton from './GearButton';
import Colors from '@/constants/colors';
export default React.memo(function TabHeader({ label, title, subtitle }: { label: string; title: string; subtitle?: string | null }) {
  return <View style={styles.header}><View style={styles.row}><Text style={styles.label}>{label}</Text><GearButton /></View><Text style={styles.title}>{title}</Text>{!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>;
});
const styles = StyleSheet.create({ header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, label: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, flex: 1 }, title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 2 }, subtitle: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 6 } });

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
export default React.memo(function Countdown({ days, size }: { days: number; size?: 'sm' | 'lg' }) { return <View style={styles.box}><Text style={[styles.number, size && { fontSize: size === 'sm' ? 22 : 48 }, days === 0 && styles.today]}>{days === 0 ? 'Hoy' : days}</Text>{days !== 0 && <Text style={styles.label}>días</Text>}</View>; });
const styles = StyleSheet.create({ box: { alignItems: 'center', minWidth: 54 }, number: { color: Colors.textPrimary, fontSize: 34, fontWeight: '800' }, today: { color: Colors.accent }, label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' } });

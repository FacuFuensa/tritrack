import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
export default React.memo(function HrCapBadge({ hrCap, size = 'lg', color = Colors.accent }: { hrCap?: number; size?: 'lg' | 'sm'; color?: string }) {
  if (hrCap == null) return null;
  return size === 'sm' ? <Text style={[styles.small, { backgroundColor: color + '20' }]}>≤ {hrCap}</Text> : <View style={styles.badge}><Text style={styles.number}>{hrCap}</Text><Text style={styles.label}>techo</Text></View>;
});
const styles = StyleSheet.create({ badge: { alignItems: 'center' }, number: { color: Colors.textPrimary, fontSize: 34, fontWeight: '800' }, label: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }, small: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden' } });

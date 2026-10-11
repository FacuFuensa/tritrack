import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
export default React.memo(function StatusBanner({ tone, title, body, actionLabel, onAction }: { tone: 'info' | 'warning'; title: string; body?: string; actionLabel?: string; onAction?: () => void }) {
  const color = tone === 'info' ? Colors.accent : Colors.warning;
  return <View style={[styles.banner, { borderLeftColor: color }]}><Text style={styles.title}>{title}</Text>{body && <Text style={styles.body}>{body}</Text>}{actionLabel && onAction && <Pressable accessibilityRole="button" onPress={onAction}><Text style={[styles.action, { color }]}>{actionLabel} →</Text></Pressable>}</View>;
});
const styles = StyleSheet.create({ banner: { backgroundColor: Colors.backgroundCard, marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 14, borderLeftWidth: 3, gap: 8 }, title: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' }, body: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', lineHeight: 20 }, action: { fontSize: 14, fontWeight: '700', paddingVertical: 4, textAlign: 'right' } });

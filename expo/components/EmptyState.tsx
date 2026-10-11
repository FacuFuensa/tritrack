import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import PrimaryButton from './PrimaryButton';
export default React.memo(function EmptyState({ icon: Icon, title, body, actionLabel, onAction }: { icon: LucideIcon; title: string; body?: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.container}><Icon size={32} color={Colors.textTertiary} /><Text style={styles.title}>{title}</Text>{body && <Text style={styles.body}>{body}</Text>}{actionLabel && onAction && <PrimaryButton label={actionLabel} onPress={onAction} />}</View>;
});
const styles = StyleSheet.create({ container: { alignItems: 'center', gap: 12, padding: 28 }, title: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', textAlign: 'center' }, body: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 21 } });

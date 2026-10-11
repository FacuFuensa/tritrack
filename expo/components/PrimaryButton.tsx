import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
export interface ButtonProps { label: string; onPress: () => void; loading?: boolean; disabled?: boolean }
export const ActionButton = React.memo(function ActionButton({ label, onPress, loading, disabled, secondary = false }: ButtonProps & { secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} style={[styles.button, secondary && styles.secondary, (disabled || loading) && styles.disabled]} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}>{loading ? <ActivityIndicator color={Colors.textPrimary} /> : <Text style={styles.text}>{label}</Text>}</Pressable>;
});
export default React.memo(function PrimaryButton(props: ButtonProps) { return <ActionButton {...props} />; });
const styles = StyleSheet.create({ button: { height: 50, borderRadius: 14, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 }, secondary: { backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.cardBorderLight }, disabled: { opacity: 0.4 }, text: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' } });

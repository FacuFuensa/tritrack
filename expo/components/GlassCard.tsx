import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
}

export default React.memo(function GlassCard({ children, style, accentColor }: GlassCardProps) {
  return (
    <View style={[styles.card, accentColor ? { borderColor: accentColor.startsWith('#') ? accentColor + '30' : accentColor } : null, style]}>
      {accentColor ? <View style={[styles.glow, { backgroundColor: accentColor.startsWith('#') ? accentColor + '08' : Colors.backgroundCard }]} /> : null}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden' as const,
  },
  glow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

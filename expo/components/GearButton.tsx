import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
export default React.memo(function GearButton() {
  return <Pressable accessibilityRole="button" accessibilityLabel="Ajustes" onPress={() => router.push('/ajustes')} style={styles.button}><Settings size={20} color={Colors.textSecondary} /></Pressable>;
});
const styles = StyleSheet.create({ button: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundCard, alignItems: 'center', justifyContent: 'center' } });

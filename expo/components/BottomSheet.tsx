import React from 'react';
import { Modal, Pressable, View, Text, StyleSheet, KeyboardAvoidingView, ScrollView } from 'react-native';
import Colors from '@/constants/colors';
export default React.memo(function BottomSheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}><KeyboardAvoidingView behavior="padding" style={styles.overlay}><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" style={StyleSheet.absoluteFill} onPress={onClose} /><View accessibilityViewIsModal style={styles.sheet}><View style={styles.handle} /><Text style={styles.title}>{title}</Text><ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView></View></KeyboardAvoidingView></Modal>;
});
const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay }, sheet: { maxHeight: '90%', padding: 20, paddingBottom: 32, backgroundColor: Colors.backgroundLight, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.textTertiary, alignSelf: 'center', marginBottom: 20 }, title: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 20 } });

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
export default React.memo(function OfflineBanner() { return <View style={styles.banner}><WifiOff size={14} color={Colors.warning} /><Text style={styles.text}>Sin conexión · estás viendo lo último que se cargó</Text></View>; });
const styles = StyleSheet.create({ banner: { marginHorizontal: 20, marginBottom: 12, padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.warning + '15' }, text: { flex: 1, color: Colors.warning, fontSize: 12, fontWeight: '600' } });

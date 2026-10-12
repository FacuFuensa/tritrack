import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import type { RaceKind } from '@/data/types';
import { raceKindName } from '@/utils/format';

// La URL firmada cambia en cada lectura de carreras; `cacheKey` (el path en el
// bucket) hace que la medalla se baje una sola vez y quede en disco.
export default React.memo(function MedalImage({ uri, cacheKey, size = 110, kind }: { uri: string | null; cacheKey?: string | null; size?: number; kind: RaceKind }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return <View style={{ width: size, height: size }}>
    {uri && uri !== failedUri ? <Image accessibilityLabel={`Medalla de ${raceKindName(kind)}`} source={{ uri, cacheKey: cacheKey ?? undefined }} cachePolicy="memory-disk" transition={150} style={{ width: size, height: size }} contentFit="contain" onError={() => setFailedUri(uri)} /> : <LinearGradient colors={[Colors.medalGold, Colors.medalGoldDark]} style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}><View style={styles.ring}><Text style={[styles.name, { fontSize: size > 150 ? 15 : 12 }]}>{raceKindName(kind)}</Text></View></LinearGradient>}
  </View>;
});
const styles = StyleSheet.create({ disc: { padding: 8, alignItems: 'center', justifyContent: 'center' }, ring: { flex: 1, alignSelf: 'stretch', borderRadius: 200, borderWidth: 1, borderColor: Colors.medalGold, alignItems: 'center', justifyContent: 'center', padding: 8 }, name: { color: Colors.background, fontWeight: '800', textAlign: 'center' } });

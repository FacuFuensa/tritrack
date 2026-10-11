import React, { useId } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import Colors from '@/constants/colors';
import type { RaceResult } from '@/data/types';
import { splitLayout, splitNames, suspendedNames, type SplitKey } from '@/utils/trophies';
import { fmtDuration } from '@/utils/format';

export const splitColors: Record<SplitKey, string> = { swim: Colors.swim, t1: Colors.textTertiary, bike: Colors.bike, t2: Colors.textTertiary, run: Colors.run };
export default React.memo(function SplitBar({ result }: { result: RaceResult }) {
  const id = useId().replace(/:/g, '');
  const parts = splitLayout(result);
  return <View style={styles.container}>
    <View style={styles.bar}>{parts.filter(p => p.width > 0).map(p => <View key={p.key} style={{ width: `${p.width}%`, height: 14 }}>
      {p.state === 'suspendido' ? <Svg width="100%" height={14}><Defs><Pattern id={`${id}-${p.key}`} width={8} height={8} patternUnits="userSpaceOnUse"><Path d="M-2 2L2-2 M0 8L8 0 M6 10L10 6" stroke={splitColors[p.key]} strokeOpacity={0.3} strokeWidth={3} /></Pattern></Defs><Rect width="100%" height={14} fill={`url(#${id}-${p.key})`} /></Svg> : <View style={{ flex: 1, backgroundColor: splitColors[p.key] }} />}
    </View>)}</View>
    <View style={styles.legend}>{parts.map(p => <Text key={p.key} style={[styles.text, p.state === 'suspendido' && { color: Colors.warning }]}><Text style={{ color: splitColors[p.key] }}>● </Text>{p.state === 'suspendido' ? suspendedNames[p.key as keyof typeof suspendedNames] : `${splitNames[p.key]} ${fmtDuration(p.seconds)}`}</Text>)}</View>
  </View>;
});
const styles = StyleSheet.create({ container: { gap: 12, marginTop: 18 }, bar: { height: 14, borderRadius: 7, overflow: 'hidden', flexDirection: 'row', backgroundColor: Colors.backgroundCard }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, text: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' } });

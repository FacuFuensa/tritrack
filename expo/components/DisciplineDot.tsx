import React from 'react';
import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import type { Discipline } from '@/data/types';
export const disciplineColor = (d: Discipline | null) => d == null ? Colors.accent : ({ swim: Colors.swim, bike: Colors.bike, run: Colors.run, brick: Colors.bike, gym: Colors.supplement, rest: Colors.textTertiary }[d]);
export default React.memo(function DisciplineDot({ discipline, size = 10 }: { discipline: Discipline; size?: number }) {
  return <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: disciplineColor(discipline) }]}>{discipline === 'brick' && <View style={[styles.half, { backgroundColor: Colors.run }]} />}</View>;
});
const styles = StyleSheet.create({ dot: { overflow: 'hidden' }, half: { position: 'absolute', bottom: 0, width: '100%', height: '50%' } });

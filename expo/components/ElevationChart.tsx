import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Polyline, Line } from 'react-native-svg';
import type { Field } from '@/data/types';
import { elevationGeometry } from '@/utils/raceScreen';
import Colors from '@/constants/colors';

export default React.memo(function ElevationChart({ field, color }: { field?: Field<[number, number][]>; color: string }) {
  if (!field) return null;
  const graph = elevationGeometry(field.value ?? []);
  if (!graph) return <Text style={styles.meta}>Altimetría · sin dato</Text>;
  return <View accessible accessibilityLabel={`Altimetría: ${graph.distance} km, de ${graph.min} a ${graph.max} m, ${field.source}`}>
    <Svg width="100%" height={140} viewBox="0 0 320 130" preserveAspectRatio="none">
      <Line x1={12} y1={120} x2={308} y2={120} stroke={Colors.cardBorderLight} />
      <Polygon points={graph.area} fill={color} fillOpacity={0.12} />
      <Polyline points={graph.line} fill="none" stroke={color} strokeWidth={2.5} />
    </Svg><View style={styles.row}><Text style={styles.meta}>{graph.min}–{graph.max} m</Text><Text style={styles.meta}>{graph.distance.toLocaleString('es-AR')} km</Text></View>
    <Text style={[styles.meta, field.source === 'estimado' && styles.estimated]}>{field.source}</Text>
    {!!field.note && <Text style={styles.meta}>{field.note}</Text>}
  </View>;
});
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between' }, meta: { color: Colors.textSecondary, fontSize: 11, fontWeight: '500', marginBottom: 6 }, estimated: { color: Colors.warning } });

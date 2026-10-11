import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type DimensionValue } from 'react-native';
import Colors from '@/constants/colors';
export default React.memo(function Skeleton({ height, width = '100%', radius = 16 }: { height: number; width?: number | string; radius?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true })])); loop.start(); return () => loop.stop(); }, [opacity]);
  return <Animated.View accessibilityLabel="Cargando" style={[styles.block, { height, width: width as DimensionValue, borderRadius: radius, opacity }]} />;
});
const styles = StyleSheet.create({ block: { backgroundColor: Colors.backgroundCardHover, marginBottom: 12 } });

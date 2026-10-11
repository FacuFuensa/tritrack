import React, { useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import type { RaceKind } from '@/data/types';
import MedalImage from './MedalImage';
import { tiltStep, TILT_MAX, type TiltBase } from '@/utils/trophies';

const clamp = (n: number) => Math.max(-TILT_MAX, Math.min(TILT_MAX, n));
const deg = (rad: number) => rad * 180 / Math.PI;
export default React.memo(function MedalTilt({ uri, size = 220, kind }: { uri: string | null; size?: number; kind: RaceKind }) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const base = useRef<TiltBase | null>(null);
  const [drag, setDrag] = useState(Platform.OS === 'web');
  const move = React.useCallback((beta: number, gamma: number) => {
    Animated.spring(x, { toValue: clamp(beta), speed: 30, bounciness: 6, useNativeDriver: true }).start();
    Animated.spring(y, { toValue: clamp(gamma), speed: 30, bounciness: 6, useNativeDriver: true }).start();
  }, [x, y]);
  useFocusEffect(React.useCallback(() => {
    let disposed = false;
    base.current = null;
    let subscription: ReturnType<typeof DeviceMotion.addListener> | undefined;
    if (Platform.OS !== 'web') {
      DeviceMotion.isAvailableAsync().then(available => {
        if (disposed) return;
        if (!available) { setDrag(true); return; }
        DeviceMotion.setUpdateInterval(16);
        subscription = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          const s = tiltStep(base.current, deg(rotation.beta), deg(rotation.gamma));
          base.current = s.base;
          move(s.x, s.y);
        });
      }).catch(() => { if (!disposed) setDrag(true); });
    }
    return () => { disposed = true; subscription?.remove(); x.stopAnimation(); y.stopAnimation(); };
  }, [move, x, y]));
  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => drag,
    onMoveShouldSetPanResponder: () => drag,
    onPanResponderMove: (_, gesture) => move(-gesture.dy / 3, gesture.dx / 3),
    onPanResponderRelease: () => move(0, 0),
    onPanResponderTerminate: () => move(0, 0),
  }), [drag, move]);
  return <View style={{ width: size, height: size }}><Animated.View {...responder.panHandlers} accessibilityLabel="Medalla inclinable" style={{ width: size, height: size, transform: [{ perspective: 800 }, { rotateX: x.interpolate({ inputRange: [-TILT_MAX, TILT_MAX], outputRange: [`-${TILT_MAX}deg`, `${TILT_MAX}deg`] }) }, { rotateY: y.interpolate({ inputRange: [-TILT_MAX, TILT_MAX], outputRange: [`-${TILT_MAX}deg`, `${TILT_MAX}deg`] }) }] }}>
    <MedalImage uri={uri} size={size} kind={kind} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: size / 2, overflow: 'hidden' }]}><Animated.View style={{ width: size * 1.6, height: size, position: 'absolute', left: -size * 0.3, transform: [{ translateX: y.interpolate({ inputRange: [-TILT_MAX, TILT_MAX], outputRange: [-size * 0.7, size * 0.7] }) }] }}><LinearGradient colors={[Colors.transparent, Colors.textPrimary, Colors.transparent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, opacity: 0.35 }} /></Animated.View></View>
  </Animated.View></View>;
});

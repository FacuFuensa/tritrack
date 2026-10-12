import React, { useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Animated, PanResponder, Platform, View } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import type { RaceKind } from '@/data/types';
import MedalImage from './MedalImage';
import { tiltStep, TILT_MAX, type TiltBase } from '@/utils/trophies';

const clamp = (n: number) => Math.max(-TILT_MAX, Math.min(TILT_MAX, n));
const deg = (rad: number) => rad * 180 / Math.PI;
// Qué tan rápido la medalla alcanza al teléfono (1/s). Más alto = más nervioso;
// más bajo = más flotante. Con 9 el ruido del sensor no se ve.
const FOLLOW = 9;

// El sensor y el dedo solo mueven el objetivo; un bucle por cuadro acerca la
// medalla al objetivo con un filtro exponencial. Así el movimiento no depende
// de cada cuánto llega el sensor ni reinicia un resorte en cada lectura.
export default React.memo(function MedalTilt({ uri, cacheKey, size = 220, kind }: { uri: string | null; cacheKey?: string | null; size?: number; kind: RaceKind }) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const base = useRef<TiltBase | null>(null);
  const [drag, setDrag] = useState(Platform.OS === 'web');
  useFocusEffect(React.useCallback(() => {
    let disposed = false;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const dt = last == null ? 0 : Math.min(now - last, 64) / 1000;
      last = now;
      const k = 1 - Math.exp(-FOLLOW * dt);
      const c = current.current, t = target.current;
      const nx = c.x + (t.x - c.x) * k, ny = c.y + (t.y - c.y) * k;
      if (Math.abs(nx - c.x) > 0.001 || Math.abs(ny - c.y) > 0.001) {
        c.x = nx; c.y = ny;
        x.setValue(nx); y.setValue(ny);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
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
          target.current = { x: s.x, y: s.y };
        });
      }).catch(() => { if (!disposed) setDrag(true); });
    }
    return () => { disposed = true; cancelAnimationFrame(frame); subscription?.remove(); };
  }, [x, y]));
  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => drag,
    onMoveShouldSetPanResponder: () => drag,
    onPanResponderMove: (_, gesture) => { target.current = { x: clamp(-gesture.dy / 3), y: clamp(gesture.dx / 3) }; },
    onPanResponderRelease: () => { target.current = { x: 0, y: 0 }; },
    onPanResponderTerminate: () => { target.current = { x: 0, y: 0 }; },
  }), [drag]);
  const range = { inputRange: [-TILT_MAX, TILT_MAX], outputRange: [`-${TILT_MAX}deg`, `${TILT_MAX}deg`] };
  return <View style={{ width: size, height: size }}><Animated.View {...responder.panHandlers} accessibilityLabel="Medalla inclinable" style={{ width: size, height: size, transform: [{ perspective: 800 }, { rotateX: x.interpolate(range) }, { rotateY: y.interpolate(range) }] }}>
    <MedalImage uri={uri} cacheKey={cacheKey} size={size} kind={kind} />
  </Animated.View></View>;
});

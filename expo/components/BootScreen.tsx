// Pantalla de carga al abrir la app: tapa todo hasta que la sesión, los datos
// de la primera pantalla y las medallas están listos, y recién ahí se abre.
// Las tres barras (nado, bici, trote) se llenan en orden mientras carga.
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { api } from '@/data/api';
import { keys } from '@/data/keys';
import type { Race } from '@/data/types';

const MIN_MS = 1200;     // lo justo para que la animación se vea entera
const MAX_MS = 10_000;   // sin conexión no nos quedamos acá para siempre
const SETTLE_MS = 250;   // sin pedidos en vuelo durante este rato = cargado
const LOOP_MS = 1800;
const bars = [Colors.swim, Colors.bike, Colors.run];

type Medal = { uri: string; cacheKey?: string };

export default function BootScreen({ authReady, needsData, onDone }: { authReady: boolean; needsData: boolean; onDone: () => void }) {
  const client = useQueryClient();
  const fetching = useIsFetching();
  const [minElapsed, setMinElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [medals, setMedals] = useState<Medal[] | null>(null);
  const [medalsLoaded, setMedalsLoaded] = useState(0);
  const [settled, setSettled] = useState(false);
  const leaving = useRef(false);

  const intro = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_MS);
    let reduce = false;
    void AccessibilityInfo.isReduceMotionEnabled().then(r => { reduce = r; }).catch(() => {});
    Animated.timing(intro, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      if (reduce || leaving.current) return;
      Animated.loop(Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    });
    loop.current = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 3, duration: LOOP_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.current.start();
    return () => clearTimeout(t);
  }, [intro, breathe, progress]);

  // Desde que se sabe si hay sesión: datos de carreras y fotos de medallas.
  useEffect(() => {
    if (!authReady) return;
    const t = setTimeout(() => setTimedOut(true), MAX_MS);
    if (!needsData) { setMedals([]); return () => clearTimeout(t); }
    let cancelled = false;
    client.prefetchQuery({ queryKey: keys.races, queryFn: () => api.races() })
      .then(() => {
        if (cancelled) return;
        const races = client.getQueryData<Race[]>(keys.races) ?? [];
        setMedals(races.filter(r => r.medal_url).map(r => ({ uri: r.medal_url!, cacheKey: r.medal_path ?? undefined })));
      })
      .catch(() => { if (!cancelled) setMedals([]); });
    return () => { cancelled = true; clearTimeout(t); };
  }, [authReady, needsData, client]);

  // La primera pantalla arma sus propias consultas debajo de esta: esperamos
  // a que no quede ninguna en vuelo.
  useEffect(() => {
    if (!authReady || fetching > 0) { setSettled(false); return; }
    const t = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, [authReady, fetching]);

  const medalsReady = medals != null && medalsLoaded >= medals.length;
  const ready = authReady && minElapsed && ((medalsReady && settled) || timedOut);

  useEffect(() => {
    if (!ready || leaving.current) return;
    leaving.current = true;
    loop.current?.stop();
    Animated.sequence([
      Animated.timing(progress, { toValue: 3, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(exit, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start(() => onDone());
  }, [ready, progress, exit, onDone]);

  const iconScale = Animated.add(
    intro.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }),
    Animated.add(breathe.interpolate({ inputRange: [0, 1], outputRange: [0, 0.035] }), exit.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] })),
  );
  return <Animated.View pointerEvents={ready ? 'none' : 'auto'} onLayout={() => { void SplashScreen.hideAsync().catch(() => {}); }} style={[StyleSheet.absoluteFill, styles.screen, { opacity: exit.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1, 0] }) }]} accessibilityLabel="Cargando TriTrack">
    <Animated.View style={{ opacity: intro, transform: [{ scale: iconScale }] }}>
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.icon} contentFit="contain" />
    </Animated.View>
    <Animated.View style={[styles.below, { opacity: Animated.multiply(intro, exit.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' })), transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <Text style={styles.title}>TriTrack</Text>
      <View style={styles.bars}>{bars.map((color, i) => <View key={color} style={styles.track}><Animated.View style={[styles.fill, { backgroundColor: color, transform: [{ scaleX: progress.interpolate({ inputRange: [i, i + 1], outputRange: [0, 1], extrapolate: 'clamp' }) }] }]} /></View>)}</View>
    </Animated.View>
    {medals?.map(m => <Image key={m.uri} source={{ uri: m.uri, cacheKey: m.cacheKey }} cachePolicy="memory-disk" style={styles.hidden} onLoad={() => setMedalsLoaded(n => n + 1)} onError={() => setMedalsLoaded(n => n + 1)} />)}
  </Animated.View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  icon: { width: 168, height: 168, borderRadius: 40 },
  below: { alignItems: 'center', marginTop: 18, gap: 18 },
  title: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  bars: { flexDirection: 'row', gap: 6 },
  track: { width: 38, height: 4, borderRadius: 2, backgroundColor: Colors.cardBorderLight, overflow: 'hidden' },
  fill: { flex: 1, borderRadius: 2, transformOrigin: 'left' },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});

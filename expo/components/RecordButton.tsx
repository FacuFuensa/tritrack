import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const SIZE = 96;

// Botón grande de micrófono. Grabando: se vuelve rojo, dos anillos laten hacia
// afuera y el núcleo crece con el volumen de la voz.
export default React.memo(function RecordButton({ recording, busy, volume, onPress }: { recording: boolean; busy?: boolean; volume: number; onPress: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const level = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!recording) { pulse.stopAnimation(); pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [recording, pulse]);

  useEffect(() => {
    Animated.timing(level, { toValue: recording ? volume : 0, duration: 100, useNativeDriver: true }).start();
  }, [volume, recording, level]);

  const ring = (offset: number) => {
    const p = Animated.modulo(Animated.add(pulse, offset), 1);
    return <Animated.View pointerEvents="none" style={[styles.ring, { opacity: p.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }), transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] }]} />;
  };

  return <View style={styles.wrap}>
    {recording && ring(0)}
    {recording && ring(0.5)}
    <Animated.View pointerEvents="none" style={[styles.glow, { opacity: recording ? 0.35 : 0, transform: [{ scale: level.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }]} />
    <Pressable accessibilityRole="button" accessibilityLabel={recording ? 'Terminar de grabar' : 'Grabar audio'} disabled={busy} onPress={() => { void Haptics.impactAsync(recording ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium); onPress(); }} style={({ pressed }) => [styles.button, recording && styles.recording, (pressed || busy) && styles.pressed]}>
      {recording ? <Square size={30} color={Colors.textPrimary} fill={Colors.textPrimary} /> : <Mic size={40} color={Colors.textPrimary} />}
    </Pressable>
  </View>;
});

const styles = StyleSheet.create({
  wrap: { width: SIZE * 2, height: SIZE * 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2, borderColor: Colors.danger },
  glow: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: Colors.danger },
  button: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  recording: { backgroundColor: Colors.danger },
  pressed: { opacity: 0.7 },
});

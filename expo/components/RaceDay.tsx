import React, { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Race } from '@/data/types';
import { todayLocal } from '@/data/calc/dates';
import { startCountdown, strategyBullets } from '@/utils/raceScreen';
import { fmtStartTime } from '@/utils/format';
import Colors from '@/constants/colors';

export default React.memo(function RaceDay({ race, offline, onClose }: { race: Race; offline: boolean; onClose: () => void }) {
  useKeepAwake();
  const [now, setNow] = useState(() => new Date());
  const [kitDone, setKitDone] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(`logistica:${race.id}`).then(raw => { if (active) setKitDone(raw ? JSON.parse(raw).kit === true : false); }).catch(() => {});
    return () => { active = false; };
  }, [race.id]);
  const countdown = startCountdown(race.date, race.start_local, now);
  const forecast = race.climate?.forecast;
  const rows = race.climate?.by_segment ?? [];
  const first = rows.find(row => row.segment === 'swim') ?? rows[0];
  const last = rows.find(row => row.segment === 'run') ?? rows.at(-1);
  const bullets = strategyBullets(race.strategy_md);
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar modo día de carrera" onPress={onClose} style={styles.close}><X size={28} color={Colors.textPrimary} /></Pressable>
    {offline && <Text style={styles.offline}>Sin conexión · datos guardados</Text>}
    <Text style={styles.label}>{race.name.toUpperCase()}</Text>
    {race.start_local && <Text style={styles.start}>Largada {fmtStartTime(race.start_local)}</Text>}
    {countdown && <Text style={styles.countdown}>{countdown}</Text>}
    {forecast ? <><Text style={styles.weather}>{forecast.temp_c} °C</Text><Text style={styles.detail}>sensación {forecast.feels_c} · viento {forecast.wind_kmh} km/h · lluvia {forecast.rain_pct} %</Text></>
      : first && last ? <><Text style={styles.weather}>{first.temp_c_median} °C → {last.temp_c_median} °C</Text><Text style={styles.detail}>sensación máx {Math.max(...rows.map(row => row.feels_max_c))} · lluvia {last.rain_years} de {last.years} años</Text></>
      : <Text style={[styles.detail, styles.weather]}>Todavía no hay datos de clima.</Text>}
    <Text style={[styles.label, styles.plan]}>PLAN</Text>
    {bullets.length ? bullets.map((text, i) => <Text key={i} style={styles.bullet}>{text}</Text>) : <Text style={styles.bullet}>El coach todavía no escribió la estrategia.</Text>}
    {!kitDone && race.date >= todayLocal(now) && !!race.logistics.retiro_kit && <Text style={[styles.detail, styles.plan]}>Retiro de kit: {race.logistics.retiro_kit}</Text>}
  </ScrollView></SafeAreaView>;
});
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.background }, content: { padding: 24, paddingBottom: 48 }, close: { width: 44, height: 44, justifyContent: 'center', marginBottom: 16 }, offline: { color: Colors.warning, fontSize: 13, fontWeight: '600', marginBottom: 16 }, label: { color: Colors.textSecondary, fontSize: 15, fontWeight: '800' }, start: { color: Colors.textPrimary, fontSize: 44, fontWeight: '800', marginTop: 16 }, countdown: { color: Colors.accent, fontSize: 28, fontWeight: '700', marginTop: 8 }, weather: { color: Colors.textPrimary, fontSize: 34, fontWeight: '800', marginTop: 32, marginBottom: 8 }, detail: { color: Colors.textSecondary, fontSize: 17, fontWeight: '600', lineHeight: 26 }, plan: { marginTop: 32, marginBottom: 16 }, bullet: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', lineHeight: 32, marginBottom: 16 } });

import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Pressable, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRace } from '@/data/useRace';
import { useRaceActions } from '@/data/useRaceActions';
import { useWeek } from '@/data/useWeek';
import { useToday } from '@/data/useToday';
import { daysTo } from '@/data/calc/races';
import { todayLocal } from '@/data/calc/dates';
import { fmtDate, fmtStartTime, raceKindName } from '@/utils/format';
import { firstRaceDayVisit } from '@/utils/raceScreen';
import Colors from '@/constants/colors';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import OfflineBanner from '@/components/OfflineBanner';
import Skeleton from '@/components/Skeleton';
import GlassCard from '@/components/GlassCard';
import Countdown from '@/components/Countdown';
import SecondaryButton from '@/components/SecondaryButton';
import MarkdownText from '@/components/MarkdownText';
import RaceLogistics from '@/components/RaceLogistics';
import RaceProfile from '@/components/RaceProfile';
import RaceDay from '@/components/RaceDay';
import s from '@/components/screenStyles';

export default function Carrera() {
  const { id, modo } = useLocalSearchParams<{ id: string; modo?: string }>();
  const { data: race, isLoading, error, refetch, isRefetching } = useRace(id);
  const { markRegistered } = useRaceActions();
  const week = useWeek();
  const today = useToday();
  const [tab, setTab] = useState<'Resumen' | 'Perfil'>('Resumen');
  const [raceDay, setRaceDay] = useState(modo === 'dia');
  const entered = useRef<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState(false);
  const days = race ? daysTo(race.date, todayLocal()) : null;
  const past = race && (race.status === 'done' || race.status === 'dns' || (days != null && days < 0));
  const raceId = race?.id;
  useEffect(() => {
    if (!raceId || entered.current === raceId) return;
    entered.current = raceId;
    let active = true;
    if (!past && modo === 'dia') {
      setRaceDay(true);
      if (days === 0) void firstRaceDayVisit(raceId, todayLocal(), AsyncStorage).catch(() => {});
    } else if (!past && days === 0) {
      void firstRaceDayVisit(raceId, todayLocal(), AsyncStorage).then(first => { if (active && first) setRaceDay(true); }).catch(() => { if (active) setRaceDay(true); });
    }
    return () => { active = false; };
  }, [raceId, days, modo, past]);
  const register = async () => {
    if (!race || registering) return;
    setRegistering(true); setRegistrationError(false);
    try { await markRegistered(race.id); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }
    catch { setRegistrationError(true); }
    finally { setRegistering(false); }
  };
  if (race && raceDay && !past) return <RaceDay race={race} offline={!!error} onClose={() => setRaceDay(false)} />;
  // El plano pide las sesiones específicas de la semana completa (también
  // permite ver el trabajo que ya preparó al atleta para esta carrera).
  const sessions = (week.data?.sessions ?? []).filter(session => session.prescription.tags?.some(tag => tag === 'especifico' || tag === 'simulacro'));
  const refresh = () => { void refetch(); void week.refetch(); void today.refetch(); };
  return <SafeAreaView style={s.screen} edges={['top']}><ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={Colors.accent} />}>
    <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/carreras')} style={s.inset}><Text style={s.action}>‹ Volver</Text></Pressable>
    {error && race && <OfflineBanner />}
    {isLoading && !race ? <View style={[s.inset, styles.skeleton]}>{[30, 20, 140, 36, 200].map((height, i) => <Skeleton key={i} height={height} />)}</View>
      : error && !race ? <ErrorState onRetry={() => { void refetch(); }} />
      : !race ? <EmptyState icon={SearchX} title="No encontramos esta carrera" actionLabel="Ir a Carreras" onAction={() => router.replace('/carreras')} />
      : <><View style={[s.inset, styles.header]}>
        <Text style={[styles.kind, { color: race.priority === 'A' ? Colors.accent : race.priority === 'B' ? Colors.bike : Colors.textSecondary }]}>{raceKindName(race.kind).toUpperCase()}{race.priority ? ` · ${race.priority}` : ''}</Text>
        <Text style={styles.title}>{race.name}</Text>
        <Text style={styles.subtitle}>{[fmtDate(race.date), race.start_local ? fmtStartTime(race.start_local) : null, race.location].filter(Boolean).join(' · ')}</Text>
        {past && <Text style={styles.kind}>{race.status === 'dns' ? 'NO LARGUÉ' : 'CORRIDA'}</Text>}
      </View>
      {!past && <GlassCard accentColor={Colors.accent}><Countdown days={days!} size="lg" /><View style={styles.dayButton}><SecondaryButton label="Modo día de carrera" onPress={() => setRaceDay(true)} /></View></GlassCard>}
      <View accessibilityRole="tablist" style={styles.tabs}>{(['Resumen', 'Perfil'] as const).map(label => <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: tab === label }} onPress={() => setTab(label)} style={[styles.tab, tab === label && styles.selected]}><Text style={styles.tabText}>{label}</Text></Pressable>)}</View>
      {tab === 'Resumen' ? <><RaceLogistics key={race.id} race={race} onRegister={() => { void register(); }} registering={registering} registrationError={registrationError} />
        <Text style={s.section}>ESTRATEGIA</Text><GlassCard>{race.strategy_md ? <MarkdownText md={race.strategy_md} /> : <Text style={s.secondary}>El coach todavía no escribió la estrategia.</Text>}</GlassCard>
        {race.status === 'done' && <Pressable accessibilityRole="button" onPress={() => router.push(`/trofeo/${race.id}`)}><GlassCard accentColor={Colors.success}><Text style={[s.title, { color: Colors.success }]}>Ver resultado y medalla →</Text></GlassCard></Pressable>}
      </> : <>{((week.error && week.data) || (today.error && today.data)) && !error && <OfflineBanner />}
        {today.error && !today.data && <ErrorState onRetry={() => { void today.refetch(); }} />}
        <RaceProfile race={race} isNext={today.data?.nextRace?.id === race.id} sessions={sessions} onSession={sessionId => router.push(`/sesion/${sessionId}`)}
        preparationState={week.isLoading && !week.data ? <View style={s.inset}><Skeleton height={96} /></View> : week.error && !week.data ? <ErrorState onRetry={() => { void week.refetch(); }} /> : undefined} /></>}
    </>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ header: { marginBottom: 20, gap: 8 }, kind: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' }, title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' }, subtitle: { color: Colors.textSecondary, fontSize: 15, fontWeight: '500' }, skeleton: { gap: 16 }, dayButton: { marginTop: 16 }, tabs: { flexDirection: 'row', marginHorizontal: 20, height: 36, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.backgroundCard, marginBottom: 24 }, tab: { flex: 1, justifyContent: 'center', alignItems: 'center' }, selected: { backgroundColor: Colors.accent }, tabText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' } });

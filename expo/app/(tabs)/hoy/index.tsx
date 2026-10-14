import React from 'react';
import { Pressable, ScrollView, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coffee, CalendarX, Mic } from 'lucide-react-native';
import { router } from 'expo-router';
import { useToday } from '@/data/useToday';
import { todayLocal } from '@/data/calc/dates';
import { firstLine, fmtDateLong, raceKindName } from '@/utils/format';
import Colors from '@/constants/colors';
import TabHeader from '@/components/TabHeader';
import Skeleton from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import OfflineBanner from '@/components/OfflineBanner';
import StatusBanner from '@/components/StatusBanner';
import GlassCard from '@/components/GlassCard';
import Countdown from '@/components/Countdown';
import SessionCard from '@/components/SessionCard';
import styles from '@/components/screenStyles';
export default function Hoy() {
  const { data, isLoading, error, refetch, isRefetching } = useToday();
  return <SafeAreaView edges={['top']} style={styles.screen}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor={Colors.accent} />}>
    <TabHeader label={fmtDateLong(data?.date ?? todayLocal()).toUpperCase()} title="Hoy" subtitle={data?.block ? `${data.block.name} · semana ${data.block.week_index}` : undefined} />
    {isLoading && !data ? <View style={styles.inset}>{[90, 80, 120, 120].map((height, i) => <Skeleton key={i} height={height} />)}</View> : error && !data ? <ErrorState onRetry={() => { void refetch(); }} /> : data && <>
      {error && <OfflineBanner />}
      {data.missingWeek && <StatusBanner tone="warning" title="La semana no llegó" body={'Abrí el coach y decí "domingo". Mientras tanto, entrená igual: lo que subas a Strava queda guardado.'} />}
      {data.proposedWeek && <StatusBanner tone="info" title="Tu semana está lista" body={firstLine(data.proposedWeek.briefing_md) || 'El coach dejó la semana propuesta.'} actionLabel="Ver la semana" onAction={() => router.push('/semana')} />}
      {data.nextRace && <Pressable accessibilityRole="button" accessibilityLabel={data.nextRace.name} onPress={() => router.push(`/carrera/${data.nextRace!.id}`)}><GlassCard><View style={styles.spread}><View style={styles.flex}><Text style={styles.label}>PRÓXIMA CARRERA{data.nextRace.priority ? ` · ${data.nextRace.priority}` : ''}</Text><Text style={[styles.title, { marginTop: 8 }]}>{data.nextRace.name}</Text><Text style={[styles.secondary, { marginTop: 6 }]}>{raceKindName(data.nextRace.kind)}</Text></View><Countdown days={data.nextRace.days_to} /></View></GlassCard></Pressable>}
      <Text style={styles.section}>ENTRENAMIENTO DE HOY</Text>
      {data.sessions.length ? data.sessions.map(s => <SessionCard key={s.id} session={s} onPress={() => router.push(`/sesion/${s.id}`)} onCheckin={() => router.push({ pathname: '/checkin', params: { session: s.id } })} />) : <EmptyState icon={data.missingWeek ? CalendarX : Coffee} title={data.missingWeek ? 'Sin plan para hoy' : 'Hoy es descanso'} body={data.missingWeek ? undefined : 'No hay nada planeado. Si salís igual, Strava lo registra.'} />}
      {data.sessions.filter(s => s.discipline !== 'rest' && s.status !== 'skipped').length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Grabar un audio para el coach" onPress={() => router.push({ pathname: '/checkin', params: { sessions: data.sessions.filter(s => s.discipline !== 'rest' && s.status !== 'skipped').map(s => s.id).join(',') } })} style={({ pressed }) => [local.voice, pressed && { opacity: 0.7 }]}><View style={local.mic}><Mic size={26} color={Colors.textPrimary} /></View><View style={styles.flex}><Text style={styles.title}>Contale al coach cómo te fue</Text><Text style={[styles.secondary, { marginTop: 4 }]}>{data.sessions.filter(s => s.discipline !== 'rest' && s.status !== 'skipped').length > 1 ? 'Un audio para todos los entrenamientos de hoy.' : 'Grabá un audio: cómo te sentiste y por qué.'}</Text></View></Pressable>}
    </>}
  </ScrollView></SafeAreaView>;
}
const local = StyleSheet.create({ voice: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 20, marginTop: 12, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: Colors.accent + '40', backgroundColor: Colors.accent + '14' }, mic: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' } });

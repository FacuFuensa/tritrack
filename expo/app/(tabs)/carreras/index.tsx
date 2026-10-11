import React from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Flag } from 'lucide-react-native';
import { useRaces } from '@/data/useRaces';
import type { Race } from '@/data/types';
import { todayLocal } from '@/data/calc/dates';
import { daysTo } from '@/data/calc/races';
import Colors from '@/constants/colors';
import { fmtDate, fmtDuration, raceKindName } from '@/utils/format';
import TabHeader from '@/components/TabHeader';
import GlassCard from '@/components/GlassCard';
import Countdown from '@/components/Countdown';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import OfflineBanner from '@/components/OfflineBanner';
import Skeleton from '@/components/Skeleton';
import s from '@/components/screenStyles';

export default function Carreras() {
  const { data, isLoading, error, refetch, isRefetching } = useRaces();
  return <SafeAreaView style={s.screen} edges={['top']}><ScrollView contentContainerStyle={s.content}
    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor={Colors.accent} />}>
    <TabHeader label="TEMPORADA" title="Carreras" />
    {error && data && <OfflineBanner />}
    {isLoading && !data ? <View style={styles.timeline}><View style={styles.line} />{[0, 1, 2, 3].map(i => <View key={i} style={styles.placeholder}><Skeleton height={96} /></View>)}</View>
      : error && !data ? <ErrorState onRetry={() => { void refetch(); }} />
      : data && !data.upcoming.length && !data.past.length ? <EmptyState icon={Flag} title="Todavía no hay carreras" body="Las carga el coach. Pedíselas por chat." />
      : data && <View style={styles.timeline}><View style={styles.line} /><Text style={[s.section, styles.section]}>PRÓXIMAS</Text>
        {!data.upcoming.length && <Text style={[s.secondary, styles.empty]}>No hay carreras por delante.</Text>}
        {data.upcoming.map(race => <RaceRow key={race.id} race={race} />)}
        {!!data.past.length && <Text style={[s.section, styles.section]}>CORRIDAS</Text>}
        {data.past.map(race => <RaceRow key={race.id} race={race} past />)}
      </View>}
  </ScrollView></SafeAreaView>;
}

const RaceRow = React.memo(function RaceRow({ race, past = false }: { race: Race; past?: boolean }) {
  const color = race.priority === 'A' ? Colors.accent : race.priority === 'B' ? Colors.bike : race.priority === 'C' ? Colors.textSecondary : Colors.cardBorderLight;
  const days = daysTo(race.date, todayLocal());
  const date = `${fmtDate(race.date)}${past && race.date.slice(0, 4) !== todayLocal().slice(0, 4) ? ` ${race.date.slice(0, 4)}` : ''}`;
  return <View><View style={[styles.node, { borderColor: color, backgroundColor: past ? Colors.background : color }]} />
    <Pressable accessibilityRole="button" accessibilityLabel={race.name} onPress={() => router.push(`/carrera/${race.id}`)} style={race.status === 'dns' ? styles.dns : undefined}>
      <GlassCard accentColor={past ? undefined : color} style={{ marginLeft: 44, ...(!past && days === 0 ? { borderColor: Colors.accent, borderWidth: 2 } : {}) }}>
        <View style={s.spread}><View style={s.flex}><Text style={styles.date}>{[date, race.location].filter(Boolean).join(' · ').toUpperCase()}</Text><Text style={styles.name}>{race.name}</Text></View>
          {past ? <View style={styles.result}><Text style={race.status === 'dns' ? s.secondary : styles.time}>{race.status === 'dns' ? 'No largué' : fmtDuration(race.result?.total_s ?? null)}</Text>
            {!!race.result?.cancelled?.length && <Text style={styles.cancelled}>con tramo suspendido</Text>}</View> : <Countdown days={days} size="sm" />}</View>
        <View style={styles.badges}><Text style={s.secondary}>{raceKindName(race.kind)}</Text>
          {race.priority && <View style={[styles.badge, { backgroundColor: race.priority === 'A' ? Colors.accent + '33' : race.priority === 'B' ? Colors.bikeDark : Colors.backgroundCardHover }]}><Text style={[styles.priority, { color }]}>{race.priority}</Text></View>}
          {!past && <View style={styles.badge}><Text style={[styles.priority, { color: race.status === 'registered' ? Colors.success : Colors.textSecondary }]}>{race.status === 'registered' ? 'Inscripto' : 'Sin inscribir'}</Text></View>}
        </View>
      </GlassCard>
    </Pressable></View>;
});

const styles = StyleSheet.create({
  timeline: { position: 'relative' }, line: { position: 'absolute', width: 2, left: 27, top: 36, bottom: 12, backgroundColor: Colors.cardBorderLight },
  node: { position: 'absolute', left: 22, top: 22, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  section: { backgroundColor: Colors.background, paddingVertical: 6 }, placeholder: { marginLeft: 44, marginRight: 20, marginBottom: 12 },
  empty: { marginLeft: 44, marginBottom: 24, fontSize: 14 }, date: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  name: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 6 }, result: { alignItems: 'flex-end', maxWidth: 115 },
  time: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' }, cancelled: { color: Colors.warning, fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 }, badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: Colors.backgroundCardHover },
  priority: { fontSize: 11, fontWeight: '800' }, dns: { opacity: 0.6 },
});

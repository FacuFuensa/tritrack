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
import { fmtDate, raceKindName } from '@/utils/format';
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
      : data && !data.upcoming.length ? <EmptyState icon={Flag} title="No hay carreras por delante" body="Las corridas están en Trofeos. Las nuevas las carga el coach: pedíselas por chat." />
      : data && <View style={styles.timeline}><View style={styles.line} /><Text style={[s.section, styles.section]}>PRÓXIMAS</Text>
        {data.upcoming.map(race => <RaceRow key={race.id} race={race} />)}
      </View>}
  </ScrollView></SafeAreaView>;
}

// Solo las próximas: las corridas viven en Trofeos.
const RaceRow = React.memo(function RaceRow({ race }: { race: Race }) {
  const color = race.priority === 'A' ? Colors.accent : race.priority === 'B' ? Colors.bike : race.priority === 'C' ? Colors.textSecondary : Colors.cardBorderLight;
  const days = daysTo(race.date, todayLocal());
  return <View><View style={[styles.node, { borderColor: color, backgroundColor: color }]} />
    <Pressable accessibilityRole="button" accessibilityLabel={race.name} onPress={() => router.push(`/carrera/${race.id}`)}>
      <GlassCard accentColor={color} style={{ marginLeft: 44, ...(days === 0 ? { borderColor: Colors.accent, borderWidth: 2 } : {}) }}>
        <View style={s.spread}><View style={s.flex}><Text style={styles.date}>{[fmtDate(race.date), race.location].filter(Boolean).join(' · ').toUpperCase()}</Text><Text style={styles.name}>{race.name}</Text></View>
          <Countdown days={days} size="sm" /></View>
        <View style={styles.badges}><Text style={s.secondary}>{raceKindName(race.kind)}</Text>
          {race.priority && <View style={[styles.badge, { backgroundColor: race.priority === 'A' ? Colors.accent + '33' : race.priority === 'B' ? Colors.bikeDark : Colors.backgroundCardHover }]}><Text style={[styles.priority, { color }]}>{race.priority}</Text></View>}
          <View style={styles.badge}><Text style={[styles.priority, { color: race.status === 'registered' ? Colors.success : Colors.textSecondary }]}>{race.status === 'registered' ? 'Inscripto' : 'Sin inscribir'}</Text></View>
        </View>
      </GlassCard>
    </Pressable></View>;
});

const styles = StyleSheet.create({
  timeline: { position: 'relative' }, line: { position: 'absolute', width: 2, left: 27, top: 36, bottom: 12, backgroundColor: Colors.cardBorderLight },
  node: { position: 'absolute', left: 22, top: 22, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  section: { backgroundColor: Colors.background, paddingVertical: 6 }, placeholder: { marginLeft: 44, marginRight: 20, marginBottom: 12 },
  date: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  name: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 6 }, 
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 }, badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: Colors.backgroundCardHover },
  priority: { fontSize: 11, fontWeight: '800' },
});

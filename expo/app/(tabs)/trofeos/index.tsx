import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Medal } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTrophies } from '@/data/useTrophies';
import { useRaces } from '@/data/useRaces';
import { useRaceActions } from '@/data/useRaceActions';
import { fmtDate, fmtDuration, raceKindName } from '@/utils/format';
import TabHeader from '@/components/TabHeader';
import GlassCard from '@/components/GlassCard';
import MedalImage from '@/components/MedalImage';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import OfflineBanner from '@/components/OfflineBanner';
import Skeleton from '@/components/Skeleton';
import SecondaryButton from '@/components/SecondaryButton';
import ManualResultSheet from '@/components/ManualResultSheet';
import shared from '@/components/screenStyles';

export default function Trofeos() {
  const { data, isLoading, error, refetch } = useTrophies();
  const races = useRaces();
  const { saveManualResult } = useRaceActions();
  const [form, setForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const eligible = races.data?.past.filter(r => r.status !== 'dns' && r.result?.total_s == null) ?? [];
  async function refresh() { setRefreshing(true); try { await Promise.all([refetch(), races.refetch()]); } finally { setRefreshing(false); } }
  return <SafeAreaView edges={['top']} style={shared.screen}>
    <ScrollView contentContainerStyle={shared.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={Colors.accent} />}>
      <TabHeader label="SALA DE TROFEOS" title="Trofeos" />
      {error && data && <OfflineBanner />}
      {isLoading && !data ? <><View style={styles.records}>{[0, 1, 2].map(i => <Skeleton key={i} width={140} height={96} />)}</View><View style={styles.grid}>{[0, 1, 2, 3].map(i => <View style={styles.cell} key={i}><Skeleton height={180} /></View>)}</View></> : error && !data ? <ErrorState onRetry={() => void refetch()} /> : data && <>
        <Text style={shared.section}>RÉCORDS</Text>
        {data.prs.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.records}>{data.prs.map(pr => <Pressable accessibilityRole="button" accessibilityLabel={`Récord ${raceKindName(pr.kind)} ${fmtDuration(pr.best_s)}`} key={pr.kind} onPress={() => router.push(`/trofeo/${pr.race_id}`)}><GlassCard style={styles.record}><Text style={styles.kind} numberOfLines={2}>{raceKindName(pr.kind).toUpperCase()}</Text><Text style={styles.best}>{fmtDuration(pr.best_s)}</Text></GlassCard></Pressable>)}</ScrollView> : <Text style={[shared.secondary, shared.inset, styles.emptyRecords]}>Todavía no hay récords: se arman con las carreras terminadas con tiempo.</Text>}
        <Text style={shared.section}>MEDALLAS</Text>
        {data.medals.length ? <View style={styles.grid}>{data.medals.map(race => <Pressable key={race.id} accessibilityRole="button" accessibilityLabel={`Ver trofeo de ${race.name}`} style={styles.cell} onPress={() => router.push(`/trofeo/${race.id}`)}><GlassCard style={styles.medal}><MedalImage uri={race.medal_url} kind={race.kind} /><Text style={styles.name} numberOfLines={2}>{race.name}</Text><Text style={styles.date}>{fmtDate(race.date)} {race.date.slice(0, 4)}</Text><Text style={[styles.time, race.result?.total_s == null && { color: Colors.textTertiary }]}>{fmtDuration(race.result?.total_s ?? null)}{race.result?.cancelled?.length ? <Text style={{ color: Colors.warning }}> · suspendido</Text> : null}</Text></GlassCard></Pressable>)}</View> : <EmptyState icon={Medal} title="Todavía no hay medallas" body="Cuando termines una carrera, aparece acá." />}
        {!!eligible.length && <View style={shared.inset}><SecondaryButton label="Cargar un resultado viejo" onPress={() => setForm(true)} /></View>}
      </>}
    </ScrollView>
    {form && <ManualResultSheet races={eligible} onClose={() => setForm(false)} onSave={saveManualResult} />}
  </SafeAreaView>;
}
const styles = StyleSheet.create({ records: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 12 }, record: { marginHorizontal: 0, marginBottom: 0, width: 140, height: 96, padding: 12, justifyContent: 'space-between' }, kind: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' }, best: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 20 }, cell: { width: '48%', flexGrow: 1, maxWidth: '50%' }, medal: { marginHorizontal: 0, marginBottom: 0, padding: 14, alignItems: 'center', height: 240, gap: 8 }, name: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 4 }, date: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' }, time: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', textAlign: 'center' }, emptyRecords: { marginBottom: 20 } });

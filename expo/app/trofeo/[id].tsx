import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View, ScrollView, RefreshControl, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchX, ExternalLink } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRace } from '@/data/useRace';
import { useTrophies } from '@/data/useTrophies';
import { useRaceActions } from '@/data/useRaceActions';
import type { Race } from '@/data/types';
import { fmtDate, fmtDuration, raceKindName } from '@/utils/format';
import { editionDifference, splitNames } from '@/utils/trophies';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import OfflineBanner from '@/components/OfflineBanner';
import Skeleton from '@/components/Skeleton';
import GlassCard from '@/components/GlassCard';
import MedalTilt from '@/components/MedalTilt';
import SplitBar, { splitColors } from '@/components/SplitBar';
import SecondaryButton from '@/components/SecondaryButton';
import shared from '@/components/screenStyles';

export default function Trofeo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: race, isLoading, error, refetch } = useRace(id);
  const trophies = useTrophies();
  const { setMedal } = useRaceActions();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [linkError, setLinkError] = useState(false);
  async function refresh() { setRefreshing(true); try { await Promise.all([refetch(), trophies.refetch()]); } finally { setRefreshing(false); } }
  async function changeMedal() {
    if (!race || uploading) return;
    setUploading(true); setUploadError(false); setPermissionDenied(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setPermissionDenied(true); return; }
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!picked.canceled && picked.assets[0]) {
        await setMedal(race.id, picked.assets[0].uri);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch { setUploadError(true); }
    finally { setUploading(false); }
  }
  const result = race?.result;
  const editions = race && trophies.data?.medals.filter(r => r.name === race.name && r.id !== race.id) || [];
  const allEditions = race && editions.length ? [...editions, race].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const pr = trophies.data?.prs.some(p => p.race_id === race?.id);
  const pulse = (['swim', 'bike', 'run'] as const).filter(k => result?.hr_by_segment?.[k] != null && !result.cancelled?.includes(k));
  const rank = (position: number, field?: number) => `${position}${field != null ? ` de ${field}` : ''}`;
  function editionDelta(other: Race) {
    if (other.id === race?.id) return <Text style={styles.muted}>esta</Text>;
    const delta = editionDifference(result ?? null, other.result);
    if (delta == null) return <Text style={styles.muted}>no comparable</Text>;
    return <Text style={[styles.delta, { color: delta < 0 ? Colors.success : delta > 0 ? Colors.danger : Colors.textSecondary }]}>{delta === 0 ? 'igual' : `${delta > 0 ? '+' : '−'}${fmtDuration(Math.abs(delta))}`}</Text>;
  }
  return <SafeAreaView edges={['top']} style={shared.screen}><ScrollView contentContainerStyle={shared.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={Colors.accent} />}>
    <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.canGoBack() ? router.back() : router.replace('/trofeos')} style={shared.inset}><Text style={shared.action}>‹ Volver</Text></Pressable>
    {((error && race) || (trophies.error && trophies.data)) && <OfflineBanner />}
    {isLoading && !race ? <><View style={styles.hero}><Skeleton height={220} width={220} radius={110} /></View><View style={[shared.inset, styles.skeleton]}><Skeleton height={30} /><Skeleton height={20} /><Skeleton height={160} /></View></> : error && !race ? <ErrorState onRetry={() => void refetch()} /> : race === null ? <EmptyState icon={SearchX} title="No encontramos este trofeo" actionLabel="Ir a Trofeos" onAction={() => router.replace('/trofeos')} /> : race && race.status !== 'done' ? <EmptyState icon={SearchX} title="Esta carrera todavía no se corrió" actionLabel="Ver la carrera" onAction={() => router.replace(`/carrera/${race.id}`)} /> : race && <>
      <View style={styles.hero}><MedalTilt uri={race.medal_url} kind={race.kind} /></View>
      <View style={styles.heading}><Text style={styles.eyebrow}>{[raceKindName(race.kind), race.location].filter(Boolean).join(' · ').toUpperCase()}</Text><Text style={styles.title}>{race.name}</Text><Text style={styles.date}>{fmtDate(race.date)} {race.date.slice(0, 4)}</Text>{pr && <Text style={styles.pr}>Récord personal</Text>}</View>
      <GlassCard><Text style={shared.label}>TIEMPO TOTAL</Text><Text style={[styles.total, result?.total_s == null && styles.missing]}>{fmtDuration(result?.total_s ?? null)}</Text>{!result && <Text style={shared.secondary}>Cargalo desde Trofeos → Cargar un resultado viejo.</Text>}{race.kind.startsWith('tri_') && result && <SplitBar result={result} />}</GlassCard>
      {result && (result.rank_overall != null || result.rank_division != null) && <GlassCard><Text style={styles.cardLabel}>PUESTOS</Text>{result.rank_overall != null && <View style={styles.row}><Text style={styles.rowLabel}>General</Text><Text style={styles.value}>{rank(result.rank_overall, result.field_overall)}</Text></View>}{result.rank_division != null && <View style={styles.row}><Text style={styles.rowLabel}>{result.division || 'Categoría'}</Text><Text style={styles.value}>{rank(result.rank_division, result.field_division)}</Text></View>}</GlassCard>}
      {!!pulse.length && <GlassCard><Text style={styles.cardLabel}>PULSO POR TRAMO</Text>{pulse.map(k => <View key={k} style={styles.row}><Text style={styles.rowLabel}><Text style={{ color: splitColors[k] }}>● </Text>{splitNames[k]}</Text><Text style={styles.value}>{result!.hr_by_segment![k]} <Text style={styles.muted}>lpm</Text></Text></View>)}</GlassCard>}
      {!!race.activity_ids.length && <GlassCard>{race.activity_ids.map((activityId, i) => <Pressable key={activityId} accessibilityRole="link" onPress={() => { setLinkError(false); void WebBrowser.openBrowserAsync(`https://www.strava.com/activities/${encodeURIComponent(activityId)}`).catch(() => setLinkError(true)); }} style={styles.row}><ExternalLink size={18} color={Colors.accent} /><Text style={[shared.action, shared.flex]}>{race.activity_ids.length === 1 ? 'Ver en Strava' : `Actividad ${i + 1}`}</Text></Pressable>)}{linkError && <Text style={shared.error}>No pudimos cargar esto</Text>}</GlassCard>}
      {trophies.isLoading && !trophies.data && <View style={shared.inset}><Skeleton height={80} /></View>}
      {trophies.error && !trophies.data && <ErrorState onRetry={() => void trophies.refetch()} />}
      {!!allEditions.length && <><Text style={shared.section}>OTRAS EDICIONES</Text><GlassCard>{allEditions.map(other => <Pressable key={other.id} accessibilityRole="button" accessibilityLabel={`Edición ${other.date.slice(0, 4)}`} disabled={other.id === race.id} onPress={() => router.replace(`/trofeo/${other.id}`)} style={styles.row}><Text style={styles.edition}>{other.date.slice(0, 4)}</Text><Text style={styles.edition}>{fmtDuration(other.result?.total_s ?? null)}</Text>{editionDelta(other)}</Pressable>)}</GlassCard></>}
      <View style={shared.inset}><SecondaryButton label="Cambiar medalla" loading={uploading} onPress={() => void changeMedal()} />{uploadError && <Text accessibilityRole="alert" style={shared.error}>No se pudo subir la foto. Probá de nuevo.</Text>}{permissionDenied && <><Text style={shared.error}>Necesito acceso a tus fotos para cambiar la medalla.</Text><SecondaryButton label="Abrir Ajustes del teléfono" onPress={() => { void Linking.openSettings().catch(() => setUploadError(true)); }} /></>}</View>
      {!!result?.source && <Text style={styles.source}>Resultado cargado de: {result.source}</Text>}
    </>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ hero: { alignItems: 'center', marginTop: 8, marginBottom: 20 }, heading: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 24, gap: 8 }, eyebrow: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center' }, title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', textAlign: 'center' }, date: { color: Colors.textSecondary, fontSize: 15, fontWeight: '500' }, pr: { color: Colors.success, backgroundColor: Colors.success + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, fontSize: 12, fontWeight: '700', marginTop: 4 }, total: { color: Colors.textPrimary, fontSize: 44, fontWeight: '800', marginTop: 8 }, missing: { color: Colors.textTertiary, fontSize: 28 }, cardLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 8 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 }, rowLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' }, value: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' }, muted: { color: Colors.textTertiary, fontSize: 13, fontWeight: '600' }, edition: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' }, delta: { fontSize: 13, fontWeight: '700' }, source: { color: Colors.textTertiary, fontSize: 11, fontWeight: '500', textAlign: 'center', margin: 20 }, skeleton: { gap: 12 } });

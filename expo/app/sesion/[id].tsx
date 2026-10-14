import React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, SearchX } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSession } from '@/data/useSession';
import Colors from '@/constants/colors';
import { disciplineName, fmtDate, fmtDistance, fmtDuration, fmtMinutes, fmtPace, fmtSwimPace } from '@/utils/format';
import GlassCard from '@/components/GlassCard';
import DisciplineDot, { disciplineColor } from '@/components/DisciplineDot';
import HrCapBadge from '@/components/HrCapBadge';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import OfflineBanner from '@/components/OfflineBanner';
import Skeleton from '@/components/Skeleton';
import PrimaryButton from '@/components/PrimaryButton';
import common from '@/components/screenStyles';

const tags = { pierna_pesada: 'pierna pesada', calidad_carrera: 'calidad', fondo: 'fondo', especifico: 'específico', simulacro: 'simulacro' };
const levels = ['nada', 'tirante', 'dolor', 'calambre'];
export default function Sesion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: s, isLoading, error, refetch, isRefetching } = useSession(id);
  const p = s?.prescription, a = s?.actual;
  const color = disciplineColor(s?.discipline ?? null);
  const actualPace = s?.discipline === 'swim' ? a?.moving_s != null && a.distance_m != null && a.distance_m > 0 ? fmtSwimPace(a.moving_s, a.distance_m) : null : a?.avg_pace_s_per_km != null ? fmtPace(a.avg_pace_s_per_km) : null;
  const rows: [string, string | null, string | null][] = [
    ['Distancia', p?.distance_m == null ? null : fmtDistance(p.distance_m, s?.discipline ?? null), a?.distance_m == null ? null : fmtDistance(a.distance_m, s?.discipline ?? null)],
    ['Tiempo', p?.dur_min == null ? null : fmtMinutes(p.dur_min), a?.moving_s == null ? null : fmtDuration(a.moving_s)],
    ['Ritmo', p?.pace ?? null, actualPace],
    ['FC media', p?.hr_cap == null ? null : `≤ ${p.hr_cap}`, a?.avg_hr == null ? null : String(a.avg_hr)],
    ['FC máx', null, a?.max_hr == null ? null : String(a.max_hr)],
  ];
  return <SafeAreaView style={common.screen}><ScrollView contentContainerStyle={common.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor={Colors.accent} />}>
    <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/hoy')} style={styles.back}><ChevronLeft size={20} color={Colors.accent} /><Text style={styles.backText}>Volver</Text></Pressable>
    {isLoading && !s ? <View style={common.inset}>{[30, 90, 70, 200].map((h, i) => <Skeleton key={i} height={h} />)}</View> : error && !s ? <ErrorState onRetry={() => { void refetch(); }} /> : !s ? <EmptyState icon={SearchX} title="Esta sesión ya no existe" body="El coach pudo haber cambiado la semana." actionLabel="Ir a Hoy" onAction={() => router.replace('/hoy')} /> : <>
      {error && <OfflineBanner />}
      <View style={styles.header}><View style={common.row}>{s.discipline && <DisciplineDot discipline={s.discipline} />}<Text style={[styles.discipline, { color }]}>{[s.discipline ? disciplineName(s.discipline) : null, fmtDate(s.date), s.slot].filter(Boolean).join(' · ').toUpperCase()}</Text></View><Text style={styles.title}>{s.title ?? disciplineName(s.discipline)}</Text><View style={styles.tags}>{s.prescription.tags?.map(t => <Text key={t} style={styles.tag}>{tags[t]}</Text>)}{s.status === 'skipped' && <Text style={styles.tag}>Salteada</Text>}</View></View>
      <GlassCard accentColor={color}><View style={styles.metrics}><HrCapBadge hrCap={s.prescription.hr_cap} />{[[s.prescription.dur_min == null ? null : fmtMinutes(s.prescription.dur_min), 'duración'], [s.prescription.distance_m == null ? null : fmtDistance(s.prescription.distance_m, s.discipline), 'distancia'], [s.prescription.pace, 'ritmo']].map(([value, label]) => value != null && <View key={label} style={styles.metric}><Text style={styles.value}>{value}</Text><Text style={common.label}>{label}</Text></View>)}</View></GlassCard>
      {s.prescription.why && <GlassCard><Text style={common.label}>PARA QUÉ</Text><Text style={[common.text, { marginTop: 8 }]}>{s.prescription.why}</Text></GlassCard>}
      {!!s.prescription.steps?.length && <><Text style={common.section}>PASOS</Text><GlassCard>{s.prescription.steps.map((step, i) => <View key={i} style={[styles.item, i > 0 && styles.divider]}><View style={common.row}><Text style={[styles.index, { backgroundColor: color + '20', color }]}>{i + 1}</Text><Text style={[common.text, common.flex, { fontWeight: '600' }]}>{step.label}</Text><Text style={styles.stepValue}>{step.reps != null ? `${step.reps} × ` : ''}{step.distance_m != null ? fmtDistance(step.distance_m, s.discipline) : step.dur_min != null ? fmtMinutes(step.dur_min) : ''}</Text><HrCapBadge hrCap={step.hr_cap} size="sm" color={color} /></View>{step.target && <Text style={styles.note}>{step.target}</Text>}{step.note && <Text style={styles.note}>{step.note}</Text>}</View>)}</GlassCard></>}
      {!!s.prescription.exercises?.length && <><Text style={common.section}>EJERCICIOS</Text><GlassCard>{s.prescription.exercises.map((ex, i) => <View key={i} style={[styles.item, i > 0 && styles.divider]}><View style={common.spread}><Text style={[common.text, common.flex, { fontWeight: '600' }]}>{ex.name}</Text><Text style={styles.stepValue}>{ex.sets} × {ex.reps}</Text></View>{ex.cue && <Text style={[common.secondary, { fontStyle: 'italic', marginTop: 5 }]}>{ex.cue}</Text>}</View>)}</GlassCard></>}
      {s.status === 'done' && <><Text style={common.section}>CÓMO SALIÓ</Text><GlassCard accentColor={Colors.success}>{!a ? <Text style={common.secondary}>Strava no trajo datos de esta actividad.</Text> : <><View style={styles.tableRow}><Text style={styles.cell} /><Text style={[styles.cell, common.label]}>PLAN</Text><Text style={[styles.cell, common.label]}>REAL</Text></View>{rows.filter(([, plan, real]) => plan != null || real != null).map(([label, plan, real]) => <View key={label} style={styles.tableRow}><Text style={[styles.cell, common.secondary]}>{label}</Text><Text style={[styles.cell, styles.tableValue]}>{plan ?? '—'}</Text><Text style={[styles.cell, styles.tableValue]}>{real ?? '—'}</Text></View>)}{s.prescription.hr_cap != null && <View style={[styles.divider, { paddingTop: 12, marginTop: 12 }]}>{a.pct_under_cap == null ? <Text style={styles.noPulse}>Sin dato de pulso para calcular el tiempo bajo el techo</Text> : <Text style={styles.under}>{Math.round(a.pct_under_cap)} % del tiempo bajo el techo</Text>}</View>}</>}</GlassCard>
      {s.checkin ? <GlassCard><Text style={common.label}>TU CHECK-IN</Text>{s.checkin.transcripcion ? <Text style={[common.text, { marginTop: 8 }]}>&quot;{s.checkin.transcripcion}&quot;</Text> : <Text style={[common.text, { marginTop: 8 }]}>RPE {s.checkin.rpe ?? 'sin dato'} · Energía {s.checkin.energia ?? 'sin dato'}/5</Text>}{s.checkin.molestia && <Text style={common.secondary}>Molestia: {s.checkin.molestia.zona} ({levels[s.checkin.molestia.nivel]})</Text>}{s.checkin.nota && <Text style={[common.secondary, { marginTop: 6 }]}>&quot;{s.checkin.nota}&quot;</Text>}</GlassCard> : <View style={common.inset}><PrimaryButton label="¿Cómo te fue?" onPress={() => router.push({ pathname: '/checkin', params: { session: s.id } })} /></View>}</>}
    </>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ back: { height: 44, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 4 }, backText: { color: Colors.accent, fontSize: 15, fontWeight: '600' }, header: { marginHorizontal: 20, paddingVertical: 12 }, discipline: { fontSize: 12, fontWeight: '700', flexShrink: 1 }, title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 10 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }, tag: { color: Colors.textSecondary, backgroundColor: Colors.backgroundCard, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, fontSize: 11, fontWeight: '700' }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }, metric: { gap: 5, alignItems: 'center' }, value: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }, item: { paddingVertical: 10 }, divider: { borderTopWidth: 1, borderColor: Colors.cardBorder }, index: { width: 22, height: 22, borderRadius: 11, textAlign: 'center', lineHeight: 22, overflow: 'hidden', fontWeight: '700' }, stepValue: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', flexShrink: 1 }, note: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginLeft: 34, marginTop: 6 }, tableRow: { flexDirection: 'row', gap: 8, paddingVertical: 7 }, cell: { flex: 1 }, tableValue: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' }, noPulse: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500', lineHeight: 21 }, under: { color: Colors.success, fontSize: 17, fontWeight: '800' } });

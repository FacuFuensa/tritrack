import React, { useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarX, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWeek } from '@/data/useWeek';
import { useWeekHistory } from '@/data/useWeekHistory';
import { useWeekActions } from '@/data/useWeekActions';
import { addDays, mondayOf, todayLocal, weekDays } from '@/data/calc/dates';
import type { Discipline, WeekKind } from '@/data/types';
import { firstLine, fmtDateLong, fmtWeekRange } from '@/utils/format';
import Colors from '@/constants/colors';
import TabHeader from '@/components/TabHeader';
import Skeleton from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import OfflineBanner from '@/components/OfflineBanner';
import WeekStrip from '@/components/WeekStrip';
import WeekBriefing from '@/components/WeekBriefing';
import WeekVolume from '@/components/WeekVolume';
import SessionCard from '@/components/SessionCard';
import GlassCard from '@/components/GlassCard';
import BottomSheet from '@/components/BottomSheet';
import PrimaryButton from '@/components/PrimaryButton';
import common from '@/components/screenStyles';

const kinds: Record<WeekKind, string> = { reset: 'DESCARGA', build: 'CONSTRUCCIÓN', peak: 'PICO', absorb: 'ASIMILACIÓN', taper: 'AFINADO', race: 'CARRERA' };
export default function Semana() {
  const params = useLocalSearchParams<{ lunes?: string }>();
  const today = todayLocal(), current = mondayOf(today);
  const [monday, setMonday] = useState(params.lunes ?? current), [selected, setSelected] = useState<string | null>(null);
  const week = useWeek(monday), history = useWeekHistory();
  const { accept, requestChanges } = useWeekActions();
  const [accepting, setAccepting] = useState(false), [acceptError, setAcceptError] = useState(false), [sheet, setSheet] = useState(false), [feedback, setFeedback] = useState(''), [sending, setSending] = useState(false), [sendError, setSendError] = useState(false);
  const scroll = useRef<ScrollView>(null), positions = useRef<Record<string, number>>({});
  useEffect(() => { if (params.lunes) setMonday(mondayOf(params.lunes)); }, [params.lunes]);
  const d = week.data, w = d?.week;
  const dots: Record<string, Discipline[]> = {}, doneDots: Record<string, boolean[]> = {};
  d?.sessions.forEach(s => { if (s.discipline) { (dots[s.date] ??= []).push(s.discipline); (doneDots[s.date] ??= []).push(s.status === 'done'); } });
  function navigate(m: string) { setMonday(m); setSelected(null); setAcceptError(false); positions.current = {}; scroll.current?.scrollTo({ y: 0, animated: true }); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
  async function acceptWeek() { if (!w || accepting) return; setAccepting(true); setAcceptError(false); try { await accept(w.id); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { setAcceptError(true); } finally { setAccepting(false); } }
  async function sendChanges() { if (!w || sending || feedback.trim().length < 5) return; setSending(true); setSendError(false); try { await requestChanges(w.id, feedback); setSheet(false); setFeedback(''); } catch { setSendError(true); } finally { setSending(false); } }
  return <SafeAreaView edges={['top']} style={common.screen}><ScrollView ref={scroll} contentContainerStyle={common.content} refreshControl={<RefreshControl refreshing={week.isRefetching || history.isRefetching} onRefresh={() => { void week.refetch(); void history.refetch(); }} tintColor={Colors.accent} />}>
    {week.isLoading && !d ? <View style={[common.inset, { marginTop: 16 }]}><Skeleton height={20} width="65%" /><Skeleton height={34} /></View> : <TabHeader label={w ? `SEMANA ${w.week_index} · ${kinds[w.kind]}` : 'SEMANA'} title={w?.focus ?? fmtWeekRange(monday)} subtitle={w?.block_name} />}
    {week.error && d && <OfflineBanner />}
    <View style={styles.navigation}><Pressable accessibilityRole="button" accessibilityLabel="Semana anterior" onPress={() => navigate(addDays(monday, -7))} style={styles.arrow}><ChevronLeft size={22} color={Colors.textPrimary} /></Pressable><Text style={styles.range}>{fmtWeekRange(monday)}</Text>{monday !== current && <Pressable accessibilityRole="button" onPress={() => navigate(current)}><Text style={styles.today}>Hoy</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="Semana siguiente" onPress={() => navigate(addDays(monday, 7))} style={styles.arrow}><ChevronRight size={22} color={Colors.textPrimary} /></Pressable></View>
    {week.isLoading && !d ? <View style={common.inset}>{[70,160,80,80,80].map((h, i) => <Skeleton key={i} height={h} />)}</View> : week.error && !d ? <ErrorState onRetry={() => { void week.refetch(); }} /> : d && <>
      <WeekStrip monday={monday} today={today} selected={selected} dots={dots} doneDots={doneDots} onSelect={date => { if (positions.current[date] == null) return; setSelected(date); scroll.current?.scrollTo({ y: positions.current[date], animated: true }); }} />
      {!w && !d.sessions.length ? <EmptyState icon={CalendarX} title="No hay plan para esta semana" body={monday >= current ? 'Si es domingo, el coach todavía no la escribió.' : undefined} /> : <>
        {w && <WeekBriefing key={w.id} week={w} accepting={accepting} error={acceptError} onAccept={() => { void acceptWeek(); }} onRequest={() => { setSendError(false); setSheet(true); }} />}
        <WeekVolume week={w ?? null} volume={d.volume} z2Pct={d.z2Pct} />
        {weekDays(monday).map(date => { const sessions = d.sessions.filter(s => s.date === date); return sessions.length ? <View key={date} onLayout={e => { positions.current[date] = e.nativeEvent.layout.y; }}><Text style={[common.section, date === today && { color: Colors.accent }]}>{fmtDateLong(date).split(' de ')[0].toUpperCase()}{date === today ? ' · HOY' : ''}</Text>{sessions.map(s => <SessionCard key={s.id} session={s} compact onPress={() => router.push(`/sesion/${s.id}`)} />)}</View> : null; })}
      </>}
      {monday === current && !history.error && !!history.data?.length && <><Text style={common.section}>SEMANAS ANTERIORES</Text>{history.data.map(h => <Pressable key={h.id} accessibilityRole="button" onPress={() => navigate(h.monday)}><GlassCard><View style={common.spread}><Text style={[common.text, { fontWeight: '700', flex: 1 }]}>Semana {h.week_index} · {fmtWeekRange(h.monday)}</Text><Text style={styles.compliance}>{h.sessions_done} de {h.sessions_planned} ✓</Text></View>{h.focus && <Text style={common.secondary}>{h.focus}</Text>}{h.briefing_md && <Text numberOfLines={1} ellipsizeMode="tail" style={common.secondary}>{firstLine(h.briefing_md)}</Text>}</GlassCard></Pressable>)}</>}
    </>}
  </ScrollView><BottomSheet visible={sheet} onClose={() => { if (!sending) setSheet(false); }} title="Pedir cambios"><TextInput accessibilityLabel="Qué querés que cambie" multiline placeholder="Qué querés que cambie: días, volumen, una sesión…" placeholderTextColor={Colors.textTertiary} value={feedback} onChangeText={setFeedback} style={common.input} /><PrimaryButton label="Mandar" disabled={feedback.trim().length < 5} loading={sending} onPress={() => { void sendChanges(); }} />{sendError && <Text style={common.error}>No se pudo mandar. Probá de nuevo.</Text>}</BottomSheet></SafeAreaView>;
}
const styles = StyleSheet.create({ navigation: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginBottom: 16 }, arrow: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }, range: { flex: 1, textAlign: 'center', color: Colors.textPrimary, fontSize: 15, fontWeight: '700' }, today: { color: Colors.accent, backgroundColor: Colors.accent + '20', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10, overflow: 'hidden', fontSize: 13, fontWeight: '700' }, compliance: { color: Colors.success, fontSize: 13, fontWeight: '700' } });

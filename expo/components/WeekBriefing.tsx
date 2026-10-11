import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import type { WeekSummary } from '@/data/types';
import Colors from '@/constants/colors';
import GlassCard from './GlassCard';
import MarkdownText from './MarkdownText';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import styles from './screenStyles';
export default React.memo(function WeekBriefing({ week: w, accepting, error, onAccept, onRequest }: { week: WeekSummary; accepting: boolean; error: boolean; onAccept: () => void; onRequest: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (w.status === 'changes_requested') return <GlassCard accentColor={Colors.warning}><Text style={[styles.label, { color: Colors.warning }]}>PEDISTE CAMBIOS</Text>{w.feedback && <Text style={[styles.text, { fontStyle: 'italic', marginVertical: 12 }]}>&quot;{w.feedback}&quot;</Text>}<Text style={styles.secondary}>El coach va a rehacer la semana.</Text></GlassCard>;
  if (w.status === 'accepted' && !w.briefing_md) return null;
  const proposed = w.status === 'proposed';
  return <GlassCard accentColor={proposed ? Colors.accent : undefined}><Text style={[styles.label, proposed && { color: Colors.accent }, { marginBottom: 12 }]}>{proposed ? 'PROPUESTA DEL COACH' : 'BRIEFING'}</Text>{w.briefing_md && <><MarkdownText md={w.briefing_md} maxLines={expanded ? undefined : proposed ? 6 : 3} /><Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}><Text style={styles.action}>{expanded ? 'Leer menos ▴' : 'Leer todo ▾'}</Text></Pressable></>}{proposed && <View style={local.buttons}><View style={styles.flex}><PrimaryButton label="Aceptar" loading={accepting} onPress={onAccept} /></View><View style={styles.flex}><SecondaryButton label="Pedir cambios" disabled={accepting} onPress={onRequest} /></View></View>}{error && <Text style={styles.error}>No se pudo aceptar. Probá de nuevo.</Text>}</GlassCard>;
});
const local = StyleSheet.create({ buttons: { flexDirection: 'row', gap: 10, marginTop: 8 } });

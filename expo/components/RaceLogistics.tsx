import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Check, ExternalLink } from 'lucide-react-native';
import type { Race } from '@/data/types';
import Colors from '@/constants/colors';
import { fmtDate } from '@/utils/format';
import GlassCard from './GlassCard';
import SecondaryButton from './SecondaryButton';
import s from './screenStyles';

type Checks = { kit: boolean; viaje: boolean };
export default React.memo(function RaceLogistics({ race, onRegister, registering, registrationError }: { race: Race; onRegister: () => void; registering: boolean; registrationError: boolean }) {
  const [checks, setChecks] = useState<Checks>({ kit: false, viaje: false });
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const writes = useRef(Promise.resolve());
  const key = `logistica:${race.id}`;
  useEffect(() => {
    let active = true;
    setReady(false);
    setChecks({ kit: false, viaje: false });
    AsyncStorage.getItem(key).then(raw => {
      const value = raw ? JSON.parse(raw) : {};
      if (active) setChecks({ kit: value.kit === true, viaje: value.viaje === true });
    }).catch(() => { if (active) setStorageError(true); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [key]);
  const toggle = (field: keyof Checks) => {
    const next = { ...checks, [field]: !checks[field] };
    setChecks(next);
    setStorageError(false);
    writes.current = writes.current.then(() => AsyncStorage.setItem(key, JSON.stringify(next))).catch(() => { setStorageError(true); });
  };
  const registered = race.status === 'registered' || race.status === 'done';
  const upcoming = race.status === 'planned' || race.status === 'registered';
  return <><Text style={s.section}>LOGÍSTICA</Text><GlassCard>
    <Checklist label="Inscripción" checked={registered} detail={registered ? 'Inscripto' : race.logistics.inscripcion_cierra ? `cierra el ${fmtDate(race.logistics.inscripcion_cierra)}` : undefined} />
    {!registered && upcoming && <View style={styles.button}><SecondaryButton label="Ya me inscribí" onPress={onRegister} loading={registering} />{registrationError && <Text style={s.error}>No se pudo guardar. Probá de nuevo.</Text>}</View>}
    {!!race.logistics.retiro_kit && <Checklist label="Retiro de kit" detail={race.logistics.retiro_kit} checked={checks.kit} disabled={!ready} onPress={() => toggle('kit')} />}
    {!!race.logistics.viaje && <Checklist label="Viaje" detail={race.logistics.viaje} checked={checks.viaje} disabled={!ready} onPress={() => toggle('viaje')} />}
    {storageError && <Text style={s.error}>No se pudo guardar. Probá de nuevo.</Text>}
    {!!race.logistics.url && <Pressable accessibilityRole="link" onPress={() => { void WebBrowser.openBrowserAsync(race.logistics.url!).catch(() => setStorageError(true)); }} style={styles.link}><ExternalLink color={Colors.accent} size={18} /><Text style={s.action}>Web de la carrera</Text></Pressable>}
  </GlassCard></>;
});
const Checklist = React.memo(function Checklist({ label, detail, checked, onPress, disabled }: { label: string; detail?: string; checked: boolean; onPress?: () => void; disabled?: boolean }) {
  return <Pressable disabled={!onPress || disabled} accessibilityRole={onPress ? 'checkbox' : undefined} accessibilityState={{ checked, disabled }} accessibilityLabel={label} onPress={onPress} style={styles.row}>
    <View style={[styles.circle, checked && { borderColor: Colors.success, backgroundColor: Colors.success }]}>{checked && <Check size={16} color={Colors.background} />}</View>
    <View style={s.flex}><Text style={styles.label}>{label}</Text>{!!detail && <Text style={s.secondary}>{detail}</Text>}</View>
  </Pressable>;
});
const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start', minHeight: 44 }, circle: { width: 22, height: 22, borderWidth: 1.5, borderColor: Colors.textTertiary, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, label: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 }, button: { marginLeft: 34, marginBottom: 10 }, link: { flexDirection: 'row', alignItems: 'center', gap: 10 } });

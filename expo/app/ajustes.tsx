// Ajustes: conexiones con Strava y Whoop, prueba de notificaciones y la
// cuenta. Reemplaza a la vieja pantalla de integraciones.
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Bell, ChevronLeft, LogOut, RefreshCw, Unlink, Link2, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import { useAuth } from '@/providers/AuthProvider';
import { useConnections, type Conn, type Provider } from '@/data/useConnections';
import { callFunction } from '@/data/functions';
import { registerPushToken } from '@/utils/notifications';

const PROVIDERS: { key: Provider; name: string; description: string; color: string }[] = [
  { key: 'strava', name: 'Strava', description: 'Tus actividades: nado, bici, trote y gym.', color: Colors.strava },
  { key: 'whoop', name: 'WHOOP', description: 'Recuperación, sueño y strain de cada día.', color: Colors.whoop },
];

type Busy = 'connect' | 'sync' | 'disconnect' | null;

function haceCuanto(iso: string | null, now = Date.now()): string {
  if (!iso) return 'Nunca sincronizado';
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (min < 1) return 'Sincronizado recién';
  if (min < 60) return `Última sincronización hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Última sincronización hace ${h} h`;
  const d = Math.round(h / 24);
  return `Última sincronización hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

const STATUS: Record<Conn['status'], { label: string; color: string }> = {
  connected: { label: 'Conectado', color: Colors.success },
  disconnected: { label: 'Desconectado', color: Colors.textTertiary },
  error: { label: 'Error', color: Colors.danger },
};

function ConnectionCard({
  provider, conn, busy, onConnect, onSync, onDisconnect,
}: {
  provider: (typeof PROVIDERS)[number];
  conn: Conn;
  busy: Busy;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const st = STATUS[conn.status];
  const isError = conn.status === 'error';

  return (
    <GlassCard accentColor={isError ? Colors.danger : provider.color} style={styles.card}>
      <View style={[styles.cardStripe, { backgroundColor: isError ? Colors.danger : provider.color }]} />
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{provider.name}</Text>
          <Text style={styles.cardDesc}>{provider.description}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: st.color + '22' }]}>
          <View style={[styles.dot, { backgroundColor: st.color }]} />
          <Text style={[styles.pillText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {isError ? (
        <View style={styles.errorRow}>
          <AlertTriangle size={14} color={Colors.danger} />
          <Text style={styles.errorText}>
            La conexión se cortó (revocada o vencida). Reconectá para seguir sincronizando.
          </Text>
        </View>
      ) : conn.status === 'connected' ? (
        <Text style={styles.syncText}>{haceCuanto(conn.lastSyncAt)}</Text>
      ) : null}

      <View style={styles.actions}>
        {conn.status === 'connected' ? (
          <>
            <ActionButton label="Sincronizar ahora" icon={RefreshCw} color={provider.color}
              loading={busy === 'sync'} disabled={!!busy} onPress={onSync} />
            <ActionButton label="Desconectar" icon={Unlink} color={Colors.textSecondary}
              loading={busy === 'disconnect'} disabled={!!busy} onPress={onDisconnect} subtle />
          </>
        ) : (
          <>
            <ActionButton label={isError ? 'Reconectar' : 'Conectar'} icon={Link2}
              color={isError ? Colors.danger : provider.color}
              loading={busy === 'connect'} disabled={!!busy} onPress={onConnect} />
            {isError ? (
              <ActionButton label="Desconectar" icon={Unlink} color={Colors.textSecondary}
                loading={busy === 'disconnect'} disabled={!!busy} onPress={onDisconnect} subtle />
            ) : null}
          </>
        )}
      </View>
    </GlassCard>
  );
}

function ActionButton({
  label, icon: Icon, color, loading, disabled, onPress, subtle,
}: {
  label: string;
  icon: typeof RefreshCw;
  color: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  subtle?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: subtle ? 'rgba(255,255,255,0.06)' : color + '22' },
        disabled && !loading && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : <Icon size={15} color={color} />}
      <Text style={[styles.btnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { account, signOut } = useAuth();
  const conns = useConnections();
  const [busy, setBusy] = useState<Record<Provider, Busy>>({ strava: null, whoop: null });
  const [testing, setTesting] = useState(false);

  const run = useCallback(async (p: Provider, kind: Exclude<Busy, null>, fn: () => Promise<unknown>) => {
    setBusy((b) => ({ ...b, [p]: kind }));
    try {
      await fn();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Algo falló', e instanceof Error ? e.message : 'Probá de nuevo.');
    } finally {
      setBusy((b) => ({ ...b, [p]: null }));
    }
  }, []);

  const confirmDisconnect = useCallback((p: Provider, name: string) => {
    Alert.alert(`Desconectar ${name}`, 'Deja de sincronizar. Lo ya guardado se queda.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desconectar', style: 'destructive', onPress: () => run(p, 'disconnect', () => conns.disconnect(p)) },
    ]);
  }, [conns, run]);

  const testNotification = useCallback(async () => {
    if (!account) return;
    setTesting(true);
    try {
      // Asegura el permiso y el token antes de mandar.
      const token = await registerPushToken(account.id);
      if (!token) {
        Alert.alert('Sin permiso', 'Activá las notificaciones en Ajustes del iPhone → TriTrack → Notificaciones.');
        return;
      }
      const { sent } = await callFunction<{ sent: number }>('notify', {
        title: 'TriTrack',
        body: 'Las notificaciones andan. 🏊🚴🏃',
        url: 'tritrack://hoy',
      });
      if (!sent) Alert.alert('No salió', 'Expo no aceptó la notificación. Revisá la clave push de Apple.');
    } catch {
      Alert.alert('No salió', 'No se pudo mandar la notificación de prueba.');
    } finally {
      setTesting(false);
    }
  }, [account]);

  const confirmSignOut = useCallback(() => {
    Alert.alert('Cerrar sesión', '¿Seguro? Vas a tener que volver a iniciar sesión.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => { void signOut(); } },
    ]);
  }, [signOut]);

  return (
    <LinearGradient colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => { void conns.refetch(); }} tintColor={Colors.accent} />
        }
      >
        <Text style={styles.sectionLabel}>CONEXIONES</Text>
        {conns.isLoading && !conns.data ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color={Colors.accent} />
        ) : (
          <>
            {conns.error && !conns.data ? (
              <Text style={styles.offline}>No se pudo leer el estado. ¿Estás sin conexión?</Text>
            ) : null}
            {PROVIDERS.map((p) => (
              <ConnectionCard
                key={p.key}
                provider={p}
                conn={conns[p.key]}
                busy={busy[p.key]}
                onConnect={() => run(p.key, 'connect', () => conns.connect(p.key))}
                onSync={() => run(p.key, 'sync', () => conns.syncNow(p.key))}
                onDisconnect={() => confirmDisconnect(p.key, p.name)}
              />
            ))}
          </>
        )}

        <Text style={styles.sectionLabel}>NOTIFICACIONES</Text>
        <GlassCard>
          <Text style={styles.cardDesc}>
            Te avisamos cuando la semana está lista y después de cada entrenamiento.
          </Text>
          <View style={styles.actions}>
            <ActionButton label="Probar notificación" icon={Bell} color={Colors.accent}
              loading={testing} disabled={testing} onPress={testNotification} />
          </View>
        </GlassCard>

        <Text style={styles.sectionLabel}>CUENTA</Text>
        <GlassCard>
          <Text style={styles.cardName}>{account?.email ?? 'Sin sesión'}</Text>
          <View style={styles.actions}>
            <ActionButton label="Cerrar sesión" icon={LogOut} color={Colors.danger} onPress={confirmSignOut} subtle />
          </View>
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 2,
    marginTop: 20, marginBottom: 10, marginHorizontal: 20,
  },
  card: { paddingTop: 19 },
  cardStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  syncText: { fontSize: 12, color: Colors.textSecondary, marginTop: 12 },
  errorRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: 12, color: Colors.danger, lineHeight: 17 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 14, fontWeight: '700' },
  offline: { fontSize: 13, color: Colors.warning, marginHorizontal: 20, marginBottom: 10 },
});

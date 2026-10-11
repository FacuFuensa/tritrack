import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';

// Strava y Whoop se conectan desde el backend (Edge Functions de Supabase) en
// la próxima versión. Hasta entonces esta pantalla solo avisa.
const integrations = [
  {
    key: 'strava',
    name: 'Strava',
    description: 'Sincroniza tus actividades: trote, bici y nado.',
    color: Colors.strava,
  },
  {
    key: 'whoop',
    name: 'WHOOP',
    description: 'Recuperación, sueño y strain del día.',
    color: Colors.whoop,
  },
];

export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Integrations</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <Zap size={22} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Disponible en la próxima versión</Text>
            <Text style={styles.bannerBody}>
              Por ahora tus entrenamientos se guardan en este teléfono.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>PRÓXIMAMENTE</Text>

        {integrations.map((item) => (
          <View key={item.key} style={styles.card}>
            <View style={[styles.cardStripe, { backgroundColor: item.color }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </View>
                <View style={styles.badge}>
                  <Clock size={14} color={Colors.textTertiary} />
                  <Text style={styles.badgeText}>Próximamente</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 16, marginTop: 8, marginBottom: 24,
  },
  bannerIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4,
  },
  bannerBody: {
    fontSize: 13, color: Colors.textSecondary, lineHeight: 19,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textTertiary,
    letterSpacing: 2, marginBottom: 12,
  },
  card: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 14,
  },
  cardStripe: { height: 3 },
  cardBody: { padding: 16 },
  cardRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 17, fontWeight: '700', color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12, color: Colors.textSecondary, marginTop: 3, maxWidth: 200,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary },
});

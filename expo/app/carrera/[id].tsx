import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flag } from 'lucide-react-native';
import EmptyState from '@/components/EmptyState';
import styles from '@/components/screenStyles';
export default function Carrera() { return <SafeAreaView style={styles.screen}><Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/hoy')} style={styles.inset}><Text style={styles.action}>‹ Volver</Text></Pressable><EmptyState icon={Flag} title="Próximamente" /></SafeAreaView>; }

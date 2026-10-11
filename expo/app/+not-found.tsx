import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import EmptyState from '@/components/EmptyState';
import styles from '@/components/screenStyles';
export default function NotFoundScreen() { return <SafeAreaView style={styles.screen}><EmptyState icon={SearchX} title="No encontramos esta pantalla" actionLabel="Ir a Hoy" onAction={() => router.replace('/hoy')} /></SafeAreaView>; }

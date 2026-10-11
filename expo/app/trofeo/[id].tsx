import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import EmptyState from '@/components/EmptyState';
import styles from '@/components/screenStyles';
export default function Trofeo() { return <SafeAreaView style={styles.screen}><Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/hoy')} style={styles.inset}><Text style={styles.action}>‹ Volver</Text></Pressable><EmptyState icon={Trophy} title="Próximamente" /></SafeAreaView>; }

import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import TabHeader from './TabHeader';
import EmptyState from './EmptyState';
import styles from './screenStyles';
export default React.memo(function ComingSoonScreen({ title }: { title: string }) { return <SafeAreaView edges={['top']} style={styles.screen}><ScrollView><TabHeader label={title.toUpperCase()} title={title} /><EmptyState icon={Clock} title="Próximamente" /></ScrollView></SafeAreaView>; });

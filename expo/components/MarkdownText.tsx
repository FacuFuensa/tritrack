import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
export default React.memo(function MarkdownText({ md, size = 15, maxLines }: { md: string; size?: number; maxLines?: number }) {
  return <Text numberOfLines={maxLines} ellipsizeMode="tail" style={[styles.text, { fontSize: size }]}>{md.split('\n').map((line, i) => { const heading = /^#{1,2} /.test(line); const text = line.replace(/^#{1,2} /, '').replace(/^- /, '• '); return <Text key={i} style={heading ? styles.heading : undefined}>{i > 0 ? '\n' : ''}{text.split(/(\*\*.*?\*\*)/g).map((t, k) => <Text key={k} style={t.startsWith('**') ? styles.bold : undefined}>{t.startsWith('**') ? t.slice(2, -2) : t}</Text>)}</Text>; })}</Text>;
});
const styles = StyleSheet.create({ text: { color: Colors.textPrimary, lineHeight: 23, fontWeight: '500' }, heading: { fontSize: 17, fontWeight: '700' }, bold: { fontWeight: '700' } });

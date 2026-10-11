import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { parseMarkdown, inline, type MdBlock } from '@/utils/markdown';

// Un solo <Text> exterior para que numberOfLines (briefing plegado) siga andando.
function Inline({ text }: { text: string }) {
  return <>{inline(text).map((p, k) => <Text key={k} style={p.bold ? styles.bold : undefined}>{p.text}</Text>)}</>;
}

function Block({ block, first }: { block: MdBlock; first: boolean }) {
  const sep = first ? '' : '\n';
  if (block.type === 'heading') return <Text style={block.level === 3 ? styles.h3 : styles.heading}>{first ? '' : '\n\n'}<Inline text={block.text} /></Text>;
  if (block.type === 'bullet') return <Text>{sep}{block.marker ?? '•'} <Inline text={block.text} /></Text>;
  if (block.type === 'row') return <Text>{first ? '' : '\n\n'}<Text style={styles.bold}><Inline text={block.title} /></Text>{block.cells.map((c, i) => <Text key={i}>{'\n'}{c.label ? <Text style={styles.label}>{c.label}: </Text> : null}<Inline text={c.value} /></Text>)}</Text>;
  return <Text>{first ? '' : '\n\n'}<Inline text={block.text} /></Text>;
}

export default React.memo(function MarkdownText({ md, size = 15, maxLines }: { md: string; size?: number; maxLines?: number }) {
  const blocks = parseMarkdown(md);
  return <Text numberOfLines={maxLines} ellipsizeMode="tail" style={[styles.text, { fontSize: size }]}>
    {blocks.map((b, i) => <Block key={i} block={b} first={i === 0} />)}
  </Text>;
});
const styles = StyleSheet.create({ text: { color: Colors.textPrimary, lineHeight: 23, fontWeight: '500' }, heading: { fontSize: 17, fontWeight: '700' }, h3: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary }, bold: { fontWeight: '700' }, label: { color: Colors.textSecondary } });

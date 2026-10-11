// Markdown mínimo para la estrategia del coach (sin dependencias): títulos #-###,
// párrafos, viñetas (con líneas que siguen debajo), listas numeradas, tablas y
// negrita. Las tablas no entran en un teléfono: cada fila pasa a un bloque con
// la primera celda como título y "encabezado: valor" para el resto.

export type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'para'; text: string }
  | { type: 'bullet'; text: string; marker?: string }
  | { type: 'row'; title: string; cells: { label: string; value: string }[] };

const HEADING = /^(#{1,3}) (.*)$/;
const BULLET = /^\s*(?:([-*+])|(\d+\.)) (.*)$/;
const TABLE = /^\s*\|.*\|\s*$/;
const SEPARATOR = /^\s*\|[\s:|-]+\|\s*$/;
const cellsOf = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

export function parseMarkdown(md: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  let header: string[] | null = null;
  let open: Extract<MdBlock, { type: 'para' | 'bullet' }> | null = null;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) { open = null; header = null; continue; }
    if (TABLE.test(line)) {
      open = null;
      if (SEPARATOR.test(line)) continue;
      const cells = cellsOf(line);
      if (!header) { header = cells; continue; }
      blocks.push({ type: 'row', title: cells[0] ?? '', cells: cells.slice(1).map((value, i) => ({ label: header![i + 1] ?? '', value })).filter(c => c.value) });
      continue;
    }
    header = null;
    const h = HEADING.exec(line);
    if (h) { open = null; blocks.push({ type: 'heading', level: h[1].length as 1 | 2 | 3, text: h[2].trim() }); continue; }
    const b = BULLET.exec(line);
    if (b) { open = { type: 'bullet', text: b[3].trim(), ...(b[2] ? { marker: b[2] } : {}) }; blocks.push(open); continue; }
    if (open) { open.text += ' ' + line.trim(); continue; }
    open = { type: 'para', text: line.trim() };
    blocks.push(open);
  }
  return blocks;
}

/** Tramos de texto con o sin negrita; los backticks se sacan. */
export function inline(text: string): { text: string; bold: boolean }[] {
  const out: { text: string; bold: boolean }[] = [];
  text.replace(/`/g, '').split(/(\*\*[^*]+\*\*)/g).forEach(part => {
    if (!part) return;
    const bold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
    const t = bold ? part.slice(2, -2) : part;
    const last = out.at(-1);
    if (last && last.bold === bold) last.text += t; else out.push({ text: t, bold });
  });
  return out;
}

export const plain = (text: string) => inline(text).map(p => p.text).join('');

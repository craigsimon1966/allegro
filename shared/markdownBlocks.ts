// Turns Markdown (with $maths$) into plain blocks for Word documents: the content review
// (TECH_SPEC 10.3) and lesson downloads. Kept small and pure so it can be unit tested.

import { protectDollars } from './dollars';

export type Inline = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  /** For maths: the original LaTeX, so Word downloads can build a real equation. */
  tex?: string;
};
export type Block =
  | { kind: 'para'; runs: Inline[] }
  | {
      kind: 'list';
      ordered: boolean;
      items: Inline[][];
      /** First number of an ordered list. */ start?: number;
    }
  | { kind: 'table'; rows: Inline[][][] }
  /** A ```visual diagram (shared/visuals.ts): the raw JSON spec. */
  | { kind: 'visual'; raw: string };

/** LaTeX as a teacher would read it on paper: 2 × 3, 6 ÷ 2, 3/4, □. */
export function plainMaths(tex: string): string {
  let s = tex;
  for (let i = 0; i < 5 && /\\frac\{/.test(s); i++)
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_m, a: string, b: string) => {
      const wrap = (x: string) => (/^[\w.]+$/.test(x) ? x : `(${x})`);
      return `${wrap(a)}/${wrap(b)}`;
    });
  return s
    .replace(/\\dollar(\{\})?/g, '$')
    .replace(/\\\$/g, '$')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\square/g, '□')
    .replace(/\\le(q)?\b/g, '≤')
    .replace(/\\ge(q)?\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\%/g, '%')
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/\\,/g, ' ')
    .replace(/[{}]/g, '');
}

/** Bold, italic and maths inside one line. */
export function inline(source: string): Inline[] {
  const md = protectDollars(source);
  const out: Inline[] = [];
  // A `\$` in words is a dollar sign, not the start of maths.
  const words = (t: string) => t.replace(/\\\$/g, '$');
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|(?<!\\)\$([^$]+)\$/g;
  let last = 0;
  for (const m of md.matchAll(re)) {
    if (m.index! > last) out.push({ text: words(md.slice(last, m.index)) });
    if (m[1] !== undefined) out.push(...inline(m[1]).map((r) => ({ ...r, bold: true })));
    else if (m[2] !== undefined) out.push({ text: words(m[2]), italic: true });
    else out.push({ text: plainMaths(m[3]!), tex: m[3]! });
    last = m.index! + m[0].length;
  }
  if (last < md.length) out.push({ text: words(md.slice(last)) });
  return out.filter((r) => r.text.length);
}

export const runsText = (runs: Inline[]) => runs.map((r) => r.text).join('');

export function blocks(source: string): Block[] {
  const md = protectDollars(source);
  const out: Block[] = [];
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!.trim();
    if (!line) {
      i++;
      continue;
    }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith('```')) body.push(lines[i++]!);
      i++;
      if (lang === 'visual') out.push({ kind: 'visual', raw: body.join('\n').trim() });
      else if (body.length) out.push({ kind: 'para', runs: [{ text: body.join(' ') }] });
      continue;
    }
    if (line.startsWith('|')) {
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('|')) {
        const cells = lines[i]!.trim()
          .replace(/^\||\|$/g, '')
          .split('|');
        if (!cells.every((c) => /^\s*:?-+:?\s*$/.test(c)))
          rows.push(cells.map((c) => inline(c.trim())));
        i++;
      }
      out.push({ kind: 'table', rows });
      continue;
    }
    const ordered = /^\d+\.\s/.test(line);
    if (ordered || /^[-*]\s/.test(line)) {
      const items: Inline[][] = [];
      const start = ordered ? parseInt(line, 10) : undefined;
      const itemRe = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (i < lines.length && itemRe.test(lines[i]!.trim())) {
        items.push(inline(lines[i]!.trim().replace(itemRe, '')));
        i++;
      }
      out.push({ kind: 'list', ordered, items, ...(start && start !== 1 ? { start } : {}) });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !/^(\||\d+\.\s|[-*]\s|```)/.test(lines[i]!.trim())
    ) {
      para.push(lines[i]!.trim());
      i++;
    }
    out.push({ kind: 'para', runs: inline(para.join(' ')) });
  }
  return out;
}

/** The same blocks as plain Markdown, for the .md copy of the review document. */
export function blocksToMarkdown(bs: Block[]): string {
  const md = (runs: Inline[]) =>
    runs.map((r) => (r.bold ? `**${r.text}**` : r.italic ? `*${r.text}*` : r.text)).join('');
  return bs
    .map((b) => {
      if (b.kind === 'para') return md(b.runs);
      if (b.kind === 'visual') return '```visual\n' + b.raw + '\n```';
      if (b.kind === 'list')
        return b.items
          .map((it, n) => `${b.ordered ? `${(b.start ?? 1) + n}.` : '-'} ${md(it)}`)
          .join('\n');
      const [head, ...rest] = b.rows;
      if (!head) return '';
      return [
        `| ${head.map(md).join(' | ')} |`,
        `| ${head.map(() => '---').join(' | ')} |`,
        ...rest.map((r) => `| ${r.map(md).join(' | ')} |`),
      ].join('\n');
    })
    .join('\n\n');
}

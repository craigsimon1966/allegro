import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { MISCONCEPTIONS, MODULES, UNITS, misconceptionById } from '../shared/catalogue';
import { tagById } from '../shared/tags';
import type { MicroUnit } from '../shared/types';
import diagnosticsFile from '../content/diagnostics.json';
import { blocks, blocksToMarkdown, inline, type Block, type Inline } from './reviewDoc';
import { unitHash } from './contentReport';

// npm run content:export-review (TECH_SPEC 10.3). Writes review/allegro-content-review.docx and a
// .md copy: every unit, the misconception bank and the diagnostic items, each with a blank
// reviewer notes, curriculum codes and Approved (Y/N) line.

interface DxItem {
  id: string;
  topicTag: string;
  stemMd: string;
  type: string;
  options?: string[];
  answer: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
  reviewedBy: string | null;
}
const DIAGNOSTICS = (diagnosticsFile as { items: DxItem[] }).items;

const FONT = 'Calibri';
const today = new Date().toLocaleDateString('en-AU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Australia/Sydney',
});

// Units in module order, then any not in a module.
const ordered: { module: string; units: MicroUnit[] }[] = MODULES.map((m) => ({
  module: m.title,
  units: m.unitIds.map((id) => UNITS.find((u) => u.id === id)).filter((u): u is MicroUnit => !!u),
})).filter((g) => g.units.length);
const placed = new Set(ordered.flatMap((g) => g.units.map((u) => u.id)));
const rest = UNITS.filter((u) => !placed.has(u.id));
if (rest.length) ordered.push({ module: 'Other units', units: rest });

const DOMAIN: Record<string, string> = {
  CK: 'Content knowledge',
  PK: 'Pedagogical knowledge',
  PCK: 'Pedagogical content knowledge',
  ASSESSMENT: 'Assessment',
  WELLBEING: 'Wellbeing',
  CONTEXT: 'Context',
};
const yearsText = (ys: string[]) => (ys.length ? `Years ${ys.join(', ')}` : 'All years');
const topic = (tag: string) => tagById(tag)?.label ?? tag;

// ---------- Word helpers ----------

const runs = (rs: Inline[], extra: { size?: number } = {}) =>
  rs.map(
    (r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic, font: FONT, ...extra }),
  );

const p = (text: string, opts: { bold?: boolean; italic?: boolean; after?: number } = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, font: FONT })],
  });

const h = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
  new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: FONT })],
  });

const label = (text: string) => p(text, { bold: true, after: 60 });

function cellTable(rows: Inline[][][], header = true) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (r, ri) =>
        new TableRow({
          tableHeader: header && ri === 0,
          children: r.map(
            (c) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: runs(c.map((x) => ({ ...x, bold: x.bold || (header && ri === 0) }))),
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function blocksToDocx(bs: Block[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const b of bs) {
    if (b.kind === 'para')
      out.push(new Paragraph({ spacing: { after: 120 }, children: runs(b.runs) }));
    else if (b.kind === 'list')
      b.items.forEach((it, n) =>
        out.push(
          new Paragraph({
            indent: { left: 400, hanging: 300 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: b.ordered ? `${n + 1}.\t` : '•\t', font: FONT }),
              ...runs(it),
            ],
          }),
        ),
      );
    else {
      out.push(cellTable(b.rows));
      out.push(new Paragraph({ children: [] }));
    }
  }
  return out;
}

const md = (s: string) => blocksToDocx(blocks(s));

interface Question {
  stemMd: string;
  options?: string[];
  answer: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}
const LETTERS = 'ABCDEFGH';
const indented = (t: string) =>
  new Paragraph({ indent: { left: 400 }, spacing: { after: 60 }, children: runs(inline(t)) });

function question(title: string, q: Question): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 120, after: 60 },
      keepNext: true,
      children: runs(inline(`**${title}.** ${q.stemMd}`)),
    }),
    ...(q.options ?? []).map((o, i) => indented(`${LETTERS[i]}.  ${o}`)),
    indented(`**Answer:** ${q.answer}`),
    indented(`**If right:** ${q.feedbackCorrect}`),
    indented(`**If wrong:** ${q.feedbackIncorrect}`),
  ];
}
const questionMd = (title: string, q: Question) =>
  [
    `**${title}.** ${q.stemMd}`,
    ...(q.options ?? []).map((o, i) => `   ${LETTERS[i]}. ${o}`),
    `   **Answer:** ${q.answer}`,
    `   **If right:** ${q.feedbackCorrect}`,
    `   **If wrong:** ${q.feedbackIncorrect}`,
  ]
    .map((l) => blocksToMarkdown([{ kind: 'para', runs: inline(l) }]))
    .join('\n');

/** A boxed area for Denise to write in. */
function reviewBox(lines: string[]) {
  const border = { style: BorderStyle.SINGLE, size: 8, color: '7F577F' };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: lines.map(
      (l) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              borders: { top: border, bottom: border, left: border, right: border },
              margins: { top: 80, bottom: 160, left: 120, right: 120 },
              children: [
                new Paragraph({ children: [new TextRun({ text: l, bold: true, font: FONT })] }),
              ],
            }),
          ],
        }),
    ),
  });
}

// ---------- Content ----------

const children: (Paragraph | Table)[] = [];
const mdOut: string[] = [];

children.push(
  new Paragraph({
    heading: HeadingLevel.TITLE,
    children: [new TextRun({ text: 'Allegro Learning: content review', font: FONT })],
  }),
  p(
    `Prepared ${today}. ${UNITS.length} learning units, ${MISCONCEPTIONS.length} misconceptions and ${DIAGNOSTICS.length} diagnostic check items.`,
  ),
  h('How to review', HeadingLevel.HEADING_1),
  p(
    'Thank you for checking this. Everything here was drafted with AI help and has not been checked by a maths educator yet. Teachers will only see it in the pilot once you have approved it.',
  ),
  p('For each unit, misconception and diagnostic item:', { after: 60 }),
  ...md(
    [
      '1. Check the maths is correct, the language suits a teacher who is new to teaching maths, and the advice is sound classroom practice.',
      '2. Make any changes straight in the text with **Track Changes** on, or add a comment. Small wording fixes are welcome.',
      '3. Fill in the box at the end: your notes, and **Approved: Y** (ready as it stands, or with your tracked changes) or **N** (needs rework).',
      '4. For each unit, add the **Australian Curriculum v9** content description codes and the **NSW Mathematics K-10** outcome codes it covers, if you know them. Craig can look up any you leave blank. Please take codes from the ACARA and NSW Curriculum websites only.',
      '5. Send the file back to Craig. Your changes are copied into Allegro exactly as you marked them, and each approved item is recorded with your name and the date.',
    ].join('\n'),
  ),
  p(
    'Maths is written as it would appear on paper (for example 2x + 1, 3/4, 6 ÷ 2). In the app it is typeset properly.',
    { italic: true },
  ),
);
mdOut.push(
  '# Allegro Learning: content review',
  `Prepared ${today}. ${UNITS.length} learning units, ${MISCONCEPTIONS.length} misconceptions and ${DIAGNOSTICS.length} diagnostic check items.`,
  'Markdown copy of `allegro-content-review.docx`. Review in the Word file; this copy is for reading and searching.',
);

// Summary table
children.push(h('Summary', HeadingLevel.HEADING_1));
const summaryRows: Inline[][][] = [
  [[{ text: 'Unit' }], [{ text: 'Area' }], [{ text: 'Years' }], [{ text: 'Approved (Y/N)' }]],
  ...ordered.flatMap((g) =>
    g.units.map((u) => [
      [{ text: u.title }],
      [{ text: DOMAIN[u.domain] ?? u.domain }],
      [{ text: yearsText(u.yearLevels) }],
      [{ text: '' }],
    ]),
  ),
];
children.push(cellTable(summaryRows));
mdOut.push('## Summary', blocksToMarkdown([{ kind: 'table', rows: summaryRows }]));

// Units
let n = 0;
for (const g of ordered) {
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    h(g.module, HeadingLevel.HEADING_1),
  );
  let first = true;
  mdOut.push(`## ${g.module}`);
  for (const u of g.units) {
    n++;
    const meta = `${u.id}  ·  ${DOMAIN[u.domain] ?? u.domain}  ·  ${yearsText(u.yearLevels)}  ·  ${u.durationMinutes} minutes  ·  Topics: ${u.tags.map(topic).join(', ')}`;
    if (!first) children.push(new Paragraph({ children: [new PageBreak()] }));
    first = false;
    children.push(h(`${n}. ${u.title}`, HeadingLevel.HEADING_2), p(meta, { italic: true }));
    mdOut.push(`### ${n}. ${u.title}`, `*${meta}*`);

    const section = (title: string, body?: string) => {
      if (!body) return;
      children.push(label(title), ...md(body));
      mdOut.push(`**${title}**`, blocksToMarkdown(blocks(body)));
    };
    section('Hook', u.hook);
    section('Core idea', u.coreIdeaMd);
    section('Worked example', u.workedExampleMd);

    if (u.checkItems.length) {
      children.push(label('Check questions'));
      mdOut.push('**Check questions**');
      u.checkItems.forEach((q, qi) => {
        children.push(...question(`Question ${qi + 1}`, q));
        mdOut.push(questionMd(`Question ${qi + 1}`, q));
      });
    }

    const mis = u.misconceptionIds.map(misconceptionById).filter(Boolean);
    if (mis.length) {
      const t = mis
        .map((m) => `- "${m!.studentSays}" (see ${m!.id} in the misconception bank)`)
        .join('\n');
      section('Linked misconceptions', t);
    }
    section('Try tomorrow', u.tryTomorrow);
    section('Reflection prompt', u.reflectPrompt);

    const box = [
      'AC v9 content description codes:',
      'NSW Mathematics K-10 outcome codes:',
      'Reviewer notes:',
      'Approved (Y/N):            Reviewer and date:',
    ];
    children.push(
      new Paragraph({ children: [] }),
      reviewBox(box),
      p(`Content version ${unitHash(u)} (lets Craig spot later edits)`, { italic: true }),
    );
    mdOut.push(...box.map((b) => `- ${b}`), `*Version ${unitHash(u)}*`);
  }
}

// Misconceptions
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  h('Misconception bank', HeadingLevel.HEADING_1),
);
children.push(
  p('These appear in lesson plans exactly as written here. The AI never writes or changes them.'),
);
mdOut.push('## Misconception bank');
for (const m of MISCONCEPTIONS) {
  children.push(h(`${m.id}  (${topic(m.topicTag)})`, HeadingLevel.HEADING_3));
  mdOut.push(`### ${m.id} (${topic(m.topicTag)})`);
  const fields: [string, string][] = [
    ['Student says', m.studentSays],
    ['Why it happens', m.whyItHappens],
    ['How to respond', m.howToRespond],
    ['Diagnostic question', m.diagnosticQuestion],
  ];
  for (const [k, v] of fields) {
    children.push(
      new Paragraph({ spacing: { after: 80 }, children: runs(inline(`**${k}:** ${v}`)) }),
    );
    mdOut.push(`**${k}:** ${v}`);
  }
  children.push(reviewBox(['Reviewer notes:', 'Approved (Y/N):']));
  mdOut.push('- Reviewer notes:', '- Approved (Y/N):');
}

// Diagnostics
children.push(
  new Paragraph({ children: [new PageBreak()] }),
  h('Diagnostic check items', HeadingLevel.HEADING_1),
);
children.push(
  p(
    'Teachers answer these privately to see which topics to refresh. Results are shown as "solid", "worth a refresh" or "start here", never as a score.',
  ),
);
mdOut.push('## Diagnostic check items');
const topics = [...new Set(DIAGNOSTICS.map((d) => d.topicTag))];
for (const t of topics) {
  children.push(h(topic(t), HeadingLevel.HEADING_2));
  mdOut.push(`### ${topic(t)}`);
  for (const d of DIAGNOSTICS.filter((x) => x.topicTag === t)) {
    children.push(...question(d.id, d));
    mdOut.push(questionMd(d.id, d));
    children.push(
      reviewBox(['Notes:                                                    Approved (Y/N):']),
      new Paragraph({ children: [] }),
    );
    mdOut.push('- Notes:', '- Approved (Y/N):');
  }
}

const doc = new Document({
  creator: 'Allegro Learning',
  title: 'Allegro Learning: content review',
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [
    {
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Allegro Learning content review  ·  page ',
                  font: FONT,
                  size: 18,
                }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const dir = join(import.meta.dirname, '..', 'review');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'allegro-content-review.docx'), await Packer.toBuffer(doc));
writeFileSync(join(dir, 'allegro-content-review.md'), mdOut.join('\n\n') + '\n');
console.log(`Wrote review/allegro-content-review.docx and .md (${UNITS.length} units).`);

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Math as WordMath,
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
import { blockMinutes } from '@shared/lesson';
import type { Lesson, LessonPack, PackItem } from '@shared/schemas';
import { blocks, inline, type Block, type Inline } from '@shared/markdownBlocks';
import { curriculumRows } from '@shared/states';
import { LEVEL_NAMES, packLevels, slideRange, slidesByBlock } from '@shared/lessonPack';
import { PRINT } from '@/lib/printColours';
import { describeVisual, parseVisual, visualBlocksIn } from '@shared/visuals';
import { visualToPng, type VisualImage } from './visualPng';
import { latexToMath } from './latexToDocx';

/**
 * Diagrams drawn as pictures, keyed by their raw ```visual spec. Drawing needs the browser and
 * is async, so `prepareVisuals` fills this before a document is built; a diagram that isn't
 * here goes in as a written description.
 */
const VISUALS = new Map<string, VisualImage>();

export function setVisualImage(raw: string, img: VisualImage) {
  VISUALS.set(raw, img);
}

/** Draws every diagram in these Markdown strings, ready for the Word builders below. */
export async function prepareVisuals(mds: string[]) {
  for (const raw of new Set(mds.flatMap(visualBlocksIn))) {
    if (VISUALS.has(raw)) continue;
    const img = await visualToPng(raw);
    if (img) VISUALS.set(raw, img);
  }
}

function visualParagraph(raw: string): Paragraph {
  const img = VISUALS.get(raw);
  const v = parseVisual(raw);
  const alt = v.ok ? describeVisual(v.spec) : 'Diagram';
  if (!img) return para([{ text: `[Diagram] ${alt}`, italic: true }]);
  // At most 15 cm wide (about 570 px at 96 dpi), keeping the shape.
  const w = Math.min(img.width, 570);
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new ImageRun({
        type: 'png',
        data: img.data,
        transformation: { width: w, height: Math.round((img.height * w) / img.width) },
        altText: { name: 'Diagram', title: 'Diagram', description: alt },
      }),
    ],
  });
}

// Word files for a lesson: the teacher guide, the student worksheets and the exit ticket slips.
// Plain Word structure (real headings, lists as text, simple tables, Calibri) so the files open
// cleanly in Microsoft Word and in Google Docs. Built in the browser, loaded only on download.

const FONT = 'Calibri';
type Child = Paragraph | Table;

const runs = (rs: Inline[], extra: { size?: number; italics?: boolean; colour?: string } = {}) =>
  rs.map((r) =>
    // Maths becomes a real Word equation (editable in Word); everything else is text.
    r.tex
      ? new WordMath({ children: latexToMath(r.tex) })
      : new TextRun({
          text: r.text,
          bold: r.bold,
          italics: r.italic || extra.italics,
          font: FONT,
          size: extra.size,
          color: extra.colour,
        }),
  );

const para = (
  rs: Inline[],
  opts: { after?: number; before?: number; italics?: boolean; size?: number; colour?: string } = {},
) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before },
    children: runs(rs, opts),
  });

const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
  new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: FONT })],
  });

function table(rows: Inline[][][], size?: number) {
  // Short cells (an x and y table) get a compact table; text tables use the full width.
  const cols = Math.max(...rows.map((r) => r.length));
  const compact = rows.every((r) => r.every((c) => c.map((x) => x.text).join('').length <= 12));
  return new Table({
    width: compact
      ? { size: cols * 1000, type: WidthType.DXA }
      : { size: 100, type: WidthType.PERCENTAGE },
    ...(compact ? { columnWidths: Array<number>(cols).fill(1000) } : {}),
    rows: rows.map(
      (r, ri) =>
        new TableRow({
          tableHeader: ri === 0,
          children: r.map(
            (c, ci) =>
              new TableCell({
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                ...(compact ? { width: { size: 1000, type: WidthType.DXA } } : {}),
                children: [
                  new Paragraph({
                    alignment: compact ? AlignmentType.CENTER : undefined,
                    children: runs(
                      c.map((x) => ({ ...x, bold: x.bold || ri === 0 || (compact && ci === 0) })),
                      { size },
                    ),
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function body(bs: Block[], size?: number): Child[] {
  const out: Child[] = [];
  for (const b of bs) {
    if (b.kind === 'para') out.push(para(b.runs, { size }));
    else if (b.kind === 'visual') out.push(visualParagraph(b.raw));
    else if (b.kind === 'list')
      b.items.forEach((it, n) =>
        out.push(
          new Paragraph({
            indent: { left: 400, hanging: 300 },
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: b.ordered ? `${(b.start ?? 1) + n}.\t` : '•\t',
                font: FONT,
                size,
              }),
              ...runs(it, { size }),
            ],
          }),
        ),
      );
    else {
      out.push(table(b.rows, size));
      out.push(new Paragraph({ children: [] }));
    }
  }
  return out;
}

const bullets = (label: string, items: string[], opts: { quote?: boolean } = {}): Child[] =>
  items.length
    ? [
        para([{ text: label, bold: true }], { after: 40 }),
        ...items.map(
          (t) =>
            new Paragraph({
              indent: { left: 400, hanging: 300 },
              spacing: { after: 40 },
              children: [
                new TextRun({ text: '•\t', font: FONT }),
                ...runs(inline(opts.quote ? `“${t}”` : t), { italics: opts.quote }),
              ],
            }),
        ),
        new Paragraph({ spacing: { after: 60 }, children: [] }),
      ]
    : [];

function footer(disclosure: string, label: string) {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${disclosure}  ${label}  ·  Page `, font: FONT, size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 }),
        ],
      }),
    ],
  });
}

function doc(title: string, disclosure: string, label: string, children: Child[], size = 22) {
  return new Document({
    creator: 'Allegro Learning',
    title,
    description: disclosure,
    styles: {
      default: {
        document: { run: { font: FONT, size } },
        title: { run: { font: FONT, size: 48, color: PRINT.ink } },
        heading1: { run: { font: FONT, size: 32, bold: true, color: PRINT.plum } },
        heading2: { run: { font: FONT, size: 26, bold: true, color: PRINT.plum } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } },
        },
        footers: { default: footer(disclosure, label) },
        children,
      },
    ],
  });
}

const timeRange = (minutes: number[], i: number) => {
  const start = minutes.slice(0, i).reduce((s, m) => s + m, 0);
  return `${start} to ${start + (minutes[i] ?? 0)} min`;
};

/** "Slides 9 to 11 · Worksheet" for a lesson block. */
function resources(pack: LessonPack, blockId: string, slides: Map<string, number[]>): string {
  const sheet = pack.worksheet.sections.some((s) => s.block_id === blockId);
  const exit = pack.exit_ticket.length > 0 && lessonBlockIsExit(pack, blockId);
  return [
    slideRange(slides.get(blockId)),
    sheet ? 'Worksheet' : '',
    exit ? 'Exit ticket slips' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
const lessonBlockIsExit = (pack: LessonPack, blockId: string) =>
  pack.slides.some((s) => s.block_id === blockId && s.kind === 'reflection');

const answerText = (md: string) => inline(md.replace(/\n+/g, ' '));

/**
 * The teacher guide. With a pack it adds a lesson-at-a-glance table, step-by-step instructions
 * (do, say, ask, watch for) and an answer key; without one it is the lesson plan as written.
 */
export function lessonDocument(
  lesson: Lesson,
  disclosure: string,
  state?: string,
  pack?: LessonPack,
): Document {
  const minutes = blockMinutes(lesson);
  const slides = pack ? slidesByBlock(pack) : new Map<string, number[]>();
  const levels = pack ? packLevels(pack) : [];
  const children: Child[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: lesson.title, font: FONT })],
    }),
    para([
      { text: pack ? 'Teacher guide · ' : '' },
      { text: `Year ${lesson.year_level}, ${lesson.duration_minutes} minutes` },
    ]),
    ...curriculumRows(lesson.curriculum_refs, state).map((r) =>
      para(
        [{ text: `${r.label}: `, bold: true }, { text: `${r.codes.join(', ')} (to be verified)` }],
        { after: 40 },
      ),
    ),
    para([{ text: disclosure, bold: true }], { after: 240 }),
  ];

  if (pack) {
    const worksheets = levels.length
      ? `Student worksheets: ${levels.map((l) => LEVEL_NAMES[l]).join(', ')} (one file each)`
      : 'Student worksheet';
    children.push(
      heading('Before the lesson', HeadingLevel.HEADING_1),
      ...bullets('In this pack', [
        'This teacher guide, with the answer key at the end',
        worksheets,
        ...(pack.exit_ticket.length ? ['Exit ticket slips (two to a page, cut in half)'] : []),
        `Smart board slides (${pack.slides.length} slides, no answers on them)`,
      ]),
      ...bullets('Get ready', [
        'Check the maths in this guide and the answer key. Allegro drafts can contain mistakes.',
        levels.length
          ? 'Print the worksheets. Most students start on Core; print fewer Start here and Stretch copies.'
          : 'Print one worksheet for each student.',
        'Open the slides on the board. Pick up the board pen: you write the working and answers live.',
        'Have mini whiteboards and markers ready for the warm up and hinge question.',
      ]),
      heading('Lesson at a glance', HeadingLevel.HEADING_1),
      table([
        [[{ text: 'Time' }], [{ text: 'Part of the lesson' }], [{ text: 'Use' }]],
        ...lesson.blocks.map((b, i) => [
          [{ text: timeRange(minutes, i) }],
          inline(b.title),
          [{ text: resources(pack, b.id, slides) }],
        ]),
      ]),
      new Paragraph({ children: [new PageBreak()] }),
      heading('Step by step', HeadingLevel.HEADING_1),
    );
  }

  lesson.blocks.forEach((b, i) => {
    const title =
      minutes[i] && !/\bmin/i.test(b.title) ? `${b.title} (${minutes[i]} min)` : b.title;
    children.push(heading(pack ? `${i + 1}. ${title}` : title, HeadingLevel.HEADING_2));
    const step = pack?.steps.find((s) => s.block_id === b.id);
    if (pack) {
      const where = [timeRange(minutes, i), resources(pack, b.id, slides)].filter(Boolean);
      children.push(para([{ text: where.join(' · ') }], { after: 80, colour: PRINT.muted }));
    }
    if (step) {
      if (step.do.length)
        children.push(
          para([{ text: 'Do', bold: true }], { after: 40 }),
          ...step.do.map(
            (t, n) =>
              new Paragraph({
                indent: { left: 400, hanging: 300 },
                spacing: { after: 40 },
                children: [new TextRun({ text: `${n + 1}.\t`, font: FONT }), ...runs(inline(t))],
              }),
          ),
          new Paragraph({ spacing: { after: 60 }, children: [] }),
        );
      children.push(
        ...bullets('Say', step.say, { quote: true }),
        ...bullets('Ask', step.ask),
        ...bullets('Watch for', step.watch_for),
      );
      children.push(para([{ text: 'From the lesson plan', bold: true }], { after: 40 }));
    }
    children.push(...body(blocks(b.content_md)));
    if (b.rationale)
      children.push(
        para([{ text: 'Why this works: ', bold: true }, ...inline(b.rationale)], {
          italics: true,
          after: 160,
        }),
      );
  });

  if (pack) children.push(...answerKey(pack));

  return doc(lesson.title, disclosure, 'Allegro Learning', children);
}

/** The sections on one worksheet: the shared ones plus that level's. */
const sheetSections = (pack: LessonPack, level: 'all' | 'start' | 'core' | 'stretch') =>
  pack.worksheet.sections.filter((s) => s.level === 'all' || level === 'all' || s.level === level);

/** The question number a section starts at on its worksheet, so the answer key matches. */
function firstNumber(pack: LessonPack, sec: LessonPack['worksheet']['sections'][number]): number {
  const sheet = sheetSections(
    pack,
    sec.level === 'all' ? (packLevels(pack)[0] ?? 'all') : sec.level,
  );
  let n = 1;
  for (const s of sheet) {
    if (s === sec) return n;
    n += s.items.length;
  }
  return 1;
}

function answerKey(pack: LessonPack): Child[] {
  const out: Child[] = [
    new Paragraph({ children: [new PageBreak()] }),
    heading('Answer key', HeadingLevel.HEADING_1),
    para([
      {
        text: 'The slides show no answers, so the class sees you work them out. Check each answer before the lesson.',
      },
    ]),
  ];
  const slideRows = pack.slides
    .map((s, i) => ({ s, n: i + 1 }))
    .filter(({ s }) => s.answer_md.trim());
  if (slideRows.length)
    out.push(
      heading('Slides', HeadingLevel.HEADING_2),
      table([
        [[{ text: 'Slide' }], [{ text: 'Question' }], [{ text: 'Answer' }]],
        ...slideRows.map(({ s, n }) => [
          [{ text: String(n) }],
          inline(s.heading),
          answerText(s.answer_md),
        ]),
      ]),
    );
  pack.worksheet.sections.forEach((sec) => {
    out.push(
      heading(
        `Worksheet: ${sec.heading}${
          sec.level !== 'all' && sec.heading !== LEVEL_NAMES[sec.level]
            ? ` (${LEVEL_NAMES[sec.level]})`
            : ''
        }`,
        HeadingLevel.HEADING_2,
      ),
      ...sec.items.map((it, n) =>
        para(
          [
            { text: `${firstNumber(pack, sec) + n}. `, bold: true },
            ...answerText(it.answer_md || 'See the lesson plan.'),
          ],
          {
            after: 60,
          },
        ),
      ),
    );
  });
  if (pack.exit_ticket.length)
    out.push(
      heading('Exit ticket', HeadingLevel.HEADING_2),
      ...pack.exit_ticket.map((it, n) =>
        para([{ text: `${n + 1}. `, bold: true }, ...answerText(it.answer_md)], { after: 60 }),
      ),
      para([
        {
          text: 'Sort the slips into three piles: got it, nearly, not yet. Start next lesson with the not yet pile.',
          italic: true,
        },
      ]),
    );
  return out;
}

// ---------------------------------------------------------------------------------------------
// Student-facing files: no answers, room to work, larger type.

const LINES: Record<PackItem['space'], number> = { short: 2, medium: 4, long: 7 };

const writingLines = (n: number): Paragraph[] =>
  Array.from(
    { length: n },
    () =>
      new Paragraph({
        spacing: { before: 0, after: 0, line: 440 },
        // "between" draws the lines inside the group: Word merges consecutive paragraphs with
        // the same borders and would otherwise draw only the last one.
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: PRINT.muted, space: 1 },
          between: { style: BorderStyle.SINGLE, size: 4, color: PRINT.muted, space: 1 },
        },
        children: [new TextRun({ text: ' ', font: FONT })],
      }),
  );

function question(it: PackItem, n: number, lines = LINES[it.space]): Child[] {
  const bs = blocks(it.prompt_md);
  const first = bs[0];
  const out: Child[] = [];
  if (first?.kind === 'para') {
    out.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        keepNext: true,
        children: [new TextRun({ text: `${n}.  `, bold: true, font: FONT }), ...runs(first.runs)],
      }),
      ...body(bs.slice(1)),
    );
  } else {
    out.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        keepNext: true,
        children: [new TextRun({ text: `Question ${n}`, bold: true, font: FONT })],
      }),
      ...body(bs),
    );
  }
  out.push(...writingLines(lines));
  return out;
}

const nameLine = () =>
  para([{ text: 'Name ____________________________     Date ______________' }], {
    before: 120,
    after: 200,
  });

/** One worksheet for a readiness level ('all' when the lesson has no levels). */
export function worksheetDocument(
  lesson: Lesson,
  pack: LessonPack,
  level: 'all' | 'start' | 'core' | 'stretch',
  disclosure: string,
): Document {
  const sections = sheetSections(pack, level);
  const children: Child[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: pack.worksheet.title || lesson.title, font: FONT })],
    }),
    para([
      { text: `Year ${lesson.year_level}` },
      ...(level !== 'all' ? [{ text: `  ·  ${LEVEL_NAMES[level]}`, bold: true }] : []),
    ]),
    nameLine(),
    para(inline(pack.worksheet.instructions), { after: 160 }),
  ];
  let n = 0;
  for (const s of sections) {
    children.push(heading(s.heading, HeadingLevel.HEADING_2));
    for (const it of s.items) children.push(...question(it, ++n));
  }
  return doc(`${lesson.title}: worksheet`, disclosure, 'Allegro Learning', children, 24);
}

/** Exit ticket slips, two to a page with a cut line. */
export function exitTicketDocument(lesson: Lesson, pack: LessonPack, disclosure: string): Document {
  const slip = (): Child[] => [
    heading(`Exit ticket: ${lesson.title}`, HeadingLevel.HEADING_2),
    nameLine(),
    ...pack.exit_ticket.flatMap((it, i) => question(it, i + 1, 3)),
  ];
  const cut = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.DASHED, size: 6, color: PRINT.muted, space: 4 } },
    children: [new TextRun({ text: 'cut here', font: FONT, size: 16, color: PRINT.muted })],
  });
  return doc(
    `${lesson.title}: exit ticket`,
    disclosure,
    'Allegro Learning',
    [...slip(), cut, ...slip()],
    24,
  );
}

/** A safe file name from the lesson title, for example "linear-relationships-year-8.docx". */
export function docxName(lesson: Lesson, suffix = '', ext = 'docx'): string {
  const slug = `${lesson.title} year ${lesson.year_level}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${slug || 'lesson'}${suffix ? `-${suffix}` : ''}.${ext}`;
}

export const docxBlob = (d: Document) => Packer.toBlob(d);
export const docxBuffer = (d: Document) => Packer.toBuffer(d);

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadLessonDocx(
  lesson: Lesson,
  disclosure: string,
  state?: string,
  pack?: LessonPack,
) {
  await prepareVisuals(lesson.blocks.map((b) => b.content_md));
  saveBlob(
    await docxBlob(lessonDocument(lesson, disclosure, state, pack)),
    docxName(lesson, pack ? 'teacher-guide' : ''),
  );
}

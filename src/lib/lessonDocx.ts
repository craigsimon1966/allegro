import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { blockMinutes } from '@shared/lesson';
import type { Lesson } from '@shared/schemas';
import { blocks, inline, type Block, type Inline } from '@shared/markdownBlocks';
import { curriculumRows } from '@shared/states';

// "Download as Word" for a lesson plan. Plain Word structure (real headings, lists as text,
// simple tables, Calibri) so the file opens cleanly in Microsoft Word and in Google Docs.
// Built in the browser and loaded only when a teacher asks for it.

const FONT = 'Calibri';

const runs = (rs: Inline[], extra: { size?: number; italics?: boolean } = {}) =>
  rs.map(
    (r) =>
      new TextRun({
        text: r.text,
        bold: r.bold,
        italics: r.italic || extra.italics,
        font: FONT,
        size: extra.size,
      }),
  );

const para = (rs: Inline[], opts: { after?: number; italics?: boolean } = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120 },
    children: runs(rs, { italics: opts.italics }),
  });

function table(rows: Inline[][][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (r, ri) =>
        new TableRow({
          tableHeader: ri === 0,
          children: r.map(
            (c) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: runs(c.map((x) => ({ ...x, bold: x.bold || ri === 0 }))),
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function body(bs: Block[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const b of bs) {
    if (b.kind === 'para') out.push(para(b.runs));
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
      out.push(table(b.rows));
      out.push(new Paragraph({ children: [] }));
    }
  }
  return out;
}

/** The Word document for a lesson, with the AI notice at the top and in every page footer. */
export function lessonDocument(lesson: Lesson, disclosure: string, state?: string): Document {
  const minutes = blockMinutes(lesson);
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: lesson.title, font: FONT })],
    }),
    para([{ text: `Year ${lesson.year_level}, ${lesson.duration_minutes} minutes` }]),
    ...curriculumRows(lesson.curriculum_refs, state).map((r) =>
      para(
        [{ text: `${r.label}: `, bold: true }, { text: `${r.codes.join(', ')} (to be verified)` }],
        {
          after: 40,
        },
      ),
    ),
    para([{ text: disclosure, bold: true }], { after: 240 }),
  ];
  lesson.blocks.forEach((b, i) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text:
              minutes[i] && !/\bmin/i.test(b.title) ? `${b.title} (${minutes[i]} min)` : b.title,
            font: FONT,
          }),
        ],
      }),
      ...body(blocks(b.content_md)),
    );
    if (b.rationale)
      children.push(
        para([{ text: 'Why this works: ', bold: true }, ...inline(b.rationale)], {
          italics: true,
          after: 160,
        }),
      );
  });

  return new Document({
    creator: 'Allegro Learning',
    title: lesson.title,
    description: disclosure,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${disclosure}  Allegro Learning  ·  Page `,
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
}

/** A safe file name from the lesson title, for example "linear-relationships-year-8.docx". */
export function docxName(lesson: Lesson): string {
  const slug = `${lesson.title} year ${lesson.year_level}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${slug || 'lesson'}.docx`;
}

export async function downloadLessonDocx(lesson: Lesson, disclosure: string, state?: string) {
  const blob = await Packer.toBlob(lessonDocument(lesson, disclosure, state));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = docxName(lesson);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

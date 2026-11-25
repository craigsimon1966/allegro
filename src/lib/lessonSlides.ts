import PptxGenJS from 'pptxgenjs';
import type { Lesson, LessonPack, PackSlide } from '@shared/schemas';
import { blocks, inline, runsText, type Block, type Inline } from '@shared/markdownBlocks';
import { describeVisual, parseVisual } from '@shared/visuals';
import { PRINT } from '@/lib/printColours';
import { visualImage } from '@/lib/visualCache';

// Smart board slides (.pptx) for a lesson. Built to survive PowerPoint, Google Slides import and
// interactive whiteboard software that opens PowerPoint (SMART Notebook, ActivInspire, OneScreen):
// plain text boxes, simple tables and rectangles only. No masters with placeholders, animations,
// transitions, SmartArt, embedded fonts or gradients. Maths diagrams go in as plain PNG pictures
// (drawn at 3x so they stay sharp), the one image type every one of those programs handles.
// Arial everywhere, dark ink on white, large type. Problems are shown without answers, with
// blank space for the board pen.

const W = 10; // LAYOUT_16x9 is 10 x 5.625 inches
const H = 5.625;
const X = 0.5;
const CW = W - 2 * X;
const FONT = 'Arial';
const BOTTOM = 5.1; // above the footer
const MIN_WRITING = 1.6;
const PIC_W = 3.7; // the diagram column on the right
const PIC_GAP = 0.3;

const pt = (size: number) => size / 72; // points to inches

/** Rough height in inches for wrapped text at a font size, across the content width. */
function textHeight(lines: string[], size: number, width = CW): number {
  const perLine = Math.max(10, Math.floor((width * 72) / (size * 0.52)));
  const count = lines.reduce((s, l) => s + Math.max(1, Math.ceil(l.length / perLine)), 0);
  return count * pt(size) * 1.25 + 0.15;
}

type Run = PptxGenJS.TextProps;

function textRuns(bs: Block[], size: number): { runs: Run[]; lines: string[] } {
  const runs: Run[] = [];
  const lines: string[] = [];
  const push = (rs: Inline[], extra: PptxGenJS.TextPropsOptions = {}) => {
    rs.forEach((r, i) =>
      runs.push({
        text: r.text,
        options: {
          bold: r.bold,
          italic: r.italic,
          fontSize: size,
          ...(i === 0 ? extra : {}),
          ...(i === rs.length - 1 ? { breakLine: true } : {}),
        },
      }),
    );
    lines.push(runsText(rs));
  };
  // List markers are written as text, not PowerPoint bullets: Google Slides and whiteboard
  // software drop or renumber automatic bullets.
  for (const b of bs) {
    if (b.kind === 'para') push(b.runs, { paraSpaceAfter: 8 });
    else if (b.kind === 'list')
      b.items.forEach((it, n) =>
        push([{ text: b.ordered ? `${(b.start ?? 1) + n}.  ` : '•  ' }, ...it], {
          paraSpaceAfter: 6,
        }),
      );
  }
  return { runs, lines };
}

const cellText = (c: Inline[]) => runsText(c);

const base64 = (data: Uint8Array) => {
  let s = '';
  for (let i = 0; i < data.length; i += 0x8000)
    s += String.fromCharCode(...data.subarray(i, i + 0x8000));
  return btoa(s);
};

/**
 * Draws the slide's diagram in the right-hand column, from `top` down to at most `maxH` inches,
 * keeping its shape. Without a drawn picture (the browser couldn't draw it), says what it shows.
 */
function addVisual(slide: PptxGenJS.Slide, raw: string, top: number, maxH: number) {
  const v = parseVisual(raw);
  const alt = v.ok ? describeVisual(v.spec) : 'Diagram';
  const x = W - X - PIC_W;
  const img = visualImage(raw);
  if (!img) {
    slide.addText(`Diagram: ${alt}`, {
      x,
      y: top,
      w: PIC_W,
      h: Math.min(maxH, 1.5),
      fontFace: FONT,
      fontSize: 14,
      italic: true,
      color: PRINT.muted,
      valign: 'top',
      margin: 0,
    });
    return;
  }
  const ratio = img.height / img.width;
  const w = Math.min(PIC_W, maxH / ratio);
  slide.addImage({
    data: `image/png;base64,${base64(img.data)}`,
    x: x + (PIC_W - w) / 2,
    y: top,
    w,
    h: w * ratio,
    altText: alt,
  });
}

function addFooter(slide: PptxGenJS.Slide, disclosure: string, n: number, total: number) {
  slide.addText(`${disclosure}   ·   ${n} of ${total}`, {
    x: X,
    y: H - 0.38,
    w: CW,
    h: 0.28,
    fontFace: FONT,
    fontSize: 10,
    color: PRINT.muted,
    align: 'right',
    margin: 0,
  });
}

function addHeading(slide: PptxGenJS.Slide, text: string) {
  slide.addText(runsText(inline(text)), {
    x: X,
    y: 0.25,
    w: CW,
    h: 0.75,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: PRINT.plum,
    valign: 'middle',
    margin: 0,
    fit: 'shrink',
  });
  slide.addShape('line', {
    x: X,
    y: 1.05,
    w: CW,
    h: 0,
    line: { color: PRINT.plum, width: 2 },
  });
}

function writingArea(slide: PptxGenJS.Slide, y: number, x = X, w = CW) {
  const h = BOTTOM - y;
  if (h < 0.6) return;
  slide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { color: PRINT.white },
    line: { color: PRINT.muted, width: 1.25, dashType: 'dash' },
  });
  slide.addText('Space for working', {
    x: x + 0.1,
    y: y + 0.05,
    w: 2.5,
    h: 0.3,
    fontFace: FONT,
    fontSize: 11,
    color: PRINT.muted,
    margin: 0,
  });
}

/** Lays out one slide; returns nothing, draws onto the slide. */
function drawSlide(pres: PptxGenJS, s: PackSlide, lesson: Lesson) {
  const slide = pres.addSlide();
  slide.background = { color: PRINT.white };

  if (s.kind === 'title') {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: 0.3,
      h: H,
      fill: { color: PRINT.plum },
      line: { color: PRINT.plum, width: 0 },
    });
    slide.addText(runsText(inline(s.heading || lesson.title)), {
      x: 1,
      y: 1.5,
      w: W - 2,
      h: 1.4,
      fontFace: FONT,
      fontSize: 48,
      bold: true,
      color: PRINT.ink,
      valign: 'bottom',
      fit: 'shrink',
      margin: 0,
    });
    slide.addText(runsText(inline(s.body_md || `Year ${lesson.year_level}`)), {
      x: 1,
      y: 3.05,
      w: W - 2,
      h: 0.7,
      fontFace: FONT,
      fontSize: 28,
      color: PRINT.muted,
      margin: 0,
    });
    return slide;
  }

  addHeading(slide, s.heading);
  const bs = blocks(s.body_md);
  const tables = bs.filter((b): b is Extract<Block, { kind: 'table' }> => b.kind === 'table');
  const text = bs.filter((b) => b.kind === 'para' || b.kind === 'list');
  const visual = bs.find((b): b is Extract<Block, { kind: 'visual' }> => b.kind === 'visual');
  const hasOptions = s.kind === 'hinge' && s.options.length > 0;
  // A diagram takes a column on the right; text, tables, options and the working space share
  // the left, so the board pen still has its room.
  const cw = visual ? CW - PIC_W - PIC_GAP : CW;
  if (visual) addVisual(slide, visual.raw, 1.25, BOTTOM - 1.25);

  // Pick the largest type that leaves room for the working space (and options).
  let y = 1.25;
  let size = 28;
  for (const candidate of [32, 28, 24, 20]) {
    size = candidate;
    const tH = text.length ? textHeight(textRuns(text, size).lines, size, cw) : 0;
    const tabH = tables.reduce((h, t) => h + t.rows.length * pt(size) * 1.7 + 0.15, 0);
    const optH = hasOptions ? 1.0 : 0;
    const free = BOTTOM - (y + tH + tabH + optH);
    const need = !s.writing_space ? 0 : hasOptions ? MIN_WRITING - 0.6 : MIN_WRITING;
    if (free >= need) break;
  }

  if (text.length) {
    const { runs, lines } = textRuns(text, size);
    const h = textHeight(lines, size, cw);
    slide.addText(runs, {
      x: X,
      y,
      w: cw,
      h,
      fontFace: FONT,
      color: PRINT.ink,
      valign: 'top',
      margin: 0,
    });
    y += h;
  }

  for (const t of tables) {
    const cols = Math.max(...t.rows.map((r) => r.length));
    const colW = Math.min(1.4, cw / cols);
    const rowH = pt(size) * 1.7;
    slide.addTable(
      t.rows.map((r, ri) =>
        r.map((c, ci) => ({
          text: cellText(c),
          options: {
            bold: ri === 0 || ci === 0,
            fill: { color: ci === 0 ? PRINT.plumLight : PRINT.white },
          },
        })),
      ),
      {
        x: X,
        y,
        w: colW * cols,
        colW: Array(cols).fill(colW),
        rowH,
        fontFace: FONT,
        fontSize: size,
        color: PRINT.ink,
        align: 'center',
        valign: 'middle',
        border: { type: 'solid', pt: 1.5, color: PRINT.ink },
        margin: 0.04,
      },
    );
    y += t.rows.length * rowH + 0.15;
  }

  if (hasOptions) {
    const n = s.options.length;
    const gap = 0.25;
    const bw = (cw - gap * (n - 1)) / n;
    s.options.forEach((o, i) => {
      slide.addText(
        [
          { text: `${i + 1}`, options: { bold: true, color: PRINT.plum, breakLine: true } },
          { text: runsText(inline(o)), options: {} },
        ],
        {
          x: X + i * (bw + gap),
          y: y + 0.05,
          w: bw,
          h: 0.9,
          fontFace: FONT,
          fontSize: Math.min(size, 26),
          color: PRINT.ink,
          align: 'center',
          valign: 'middle',
          line: { color: PRINT.ink, width: 1.5 },
          fit: 'shrink',
        },
      );
    });
    y += 1.0;
  }

  if (s.writing_space) writingArea(slide, y + 0.1, X, cw);
  return slide;
}

/** Speaker notes: what to say and ask on this part of the lesson. Never the answers. */
function notesFor(s: PackSlide, pack: LessonPack): string {
  const step = pack.steps.find((x) => x.block_id === s.block_id);
  if (!step) return '';
  return [
    ...step.say.map((t) => `Say: ${runsText(inline(t))}`),
    ...step.ask.map((t) => `Ask: ${runsText(inline(t))}`),
  ].join('\n');
}

export function lessonPresentation(lesson: Lesson, pack: LessonPack, disclosure: string) {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'Allegro Learning';
  pres.company = 'Allegro Learning';
  pres.title = lesson.title;
  pres.subject = disclosure;
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  const total = pack.slides.length;
  pack.slides.forEach((s, i) => {
    const slide = drawSlide(pres, s, lesson);
    addFooter(slide, disclosure, i + 1, total);
    const notes = notesFor(s, pack);
    if (notes) slide.addNotes(notes);
  });
  return pres;
}

export async function slidesBlob(lesson: Lesson, pack: LessonPack, disclosure: string) {
  return (await lessonPresentation(lesson, pack, disclosure).write({
    outputType: 'blob',
  })) as Blob;
}

export async function slidesBuffer(lesson: Lesson, pack: LessonPack, disclosure: string) {
  return (await lessonPresentation(lesson, pack, disclosure).write({
    outputType: 'uint8array',
  })) as Uint8Array;
}

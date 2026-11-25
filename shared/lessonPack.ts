import type { Lesson, LessonBlock, LessonPack, PackItem, PackSlide } from './schemas';
import { LessonPackSchema } from './schemas';
import { DEMO_LESSON } from './lesson';
import demoPackFile from '../content/lessons/demo-tammy-linear-pack.json';

// The classroom pack for a lesson (worksheets, teacher steps, smart board slides). The AI drafts
// it from the finished lesson; these helpers keep it consistent with the lesson, and build a
// plainer pack straight from the lesson text when the AI is not available.

/** A short fingerprint of the lesson content, so a pack is redrafted after the lesson changes. */
export function lessonKey(lesson: Lesson): string {
  const text = JSON.stringify([
    lesson.title,
    lesson.year_level,
    lesson.blocks.map((b) => [b.id, b.type, b.title, b.content_md]),
  ]);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const clean = (s: string) => s.replace(/\s*—\s*/g, ', ');
const cleanAll = <T>(v: T): T =>
  typeof v === 'string'
    ? (clean(v) as T)
    : Array.isArray(v)
      ? (v.map(cleanAll) as T)
      : v && typeof v === 'object'
        ? (Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanAll(x)])) as T)
        : v;

const SPACE_SLIDES: PackSlide['kind'][] = ['example', 'problem', 'hinge'];

/** Code-enforced rules on any pack, whatever the model wrote. */
export function groundPack(pack: LessonPack, lesson: Lesson): LessonPack {
  const ids = new Set(lesson.blocks.map((b) => b.id));
  const p = cleanAll(pack);
  const order = new Map(lesson.blocks.map((b, i) => [b.id, i]));
  const steps = p.steps
    .filter((s) => ids.has(s.block_id))
    .filter((s, i, all) => all.findIndex((x) => x.block_id === s.block_id) === i)
    .sort((a, b) => order.get(a.block_id)! - order.get(b.block_id)!);
  const slides = p.slides.slice(0, 18).map((s) => ({
    ...s,
    block_id: ids.has(s.block_id) ? s.block_id : '',
    writing_space: s.writing_space || SPACE_SLIDES.includes(s.kind),
  }));
  if (slides[0]?.kind !== 'title') slides.unshift(titleSlide(lesson));
  return {
    ...p,
    steps,
    worksheet: {
      ...p.worksheet,
      sections: p.worksheet.sections
        .filter((s) => s.items.length)
        .map((s) => ({ ...s, block_id: ids.has(s.block_id) ? s.block_id : '' })),
    },
    slides: slides.slice(0, 18),
  };
}

const titleSlide = (lesson: Lesson): PackSlide => ({
  kind: 'title',
  block_id: '',
  heading: lesson.title,
  body_md: `Year ${lesson.year_level}`,
  options: [],
  writing_space: false,
  answer_md: '',
});

// ---------------------------------------------------------------------------------------------
// The plainer pack, built from the lesson text when the AI is not available.

const ANSWER = /^\*\*(model answers?|answers?|answer key)\b[^*]*\*\*:?\s*/i;
const DROP = /^\*\*(marking guide)\b/i;
const LEVELS: { re: RegExp; level: 'start' | 'core' | 'stretch'; heading: string }[] = [
  { re: /^\*\*start here\*\*$/i, level: 'start', heading: 'Start here' },
  { re: /^\*\*core\*\*$/i, level: 'core', heading: 'Core' },
  { re: /^\*\*stretch\*\*$/i, level: 'stretch', heading: 'Stretch' },
];

interface Parsed {
  /** Lines before the first numbered question (instructions, tables). */
  intro: string[];
  items: { n: number; prompt: string; level?: 'start' | 'core' | 'stretch' }[];
  answers: Map<number, string>;
  /** The answer paragraph as written, for the answer key. */
  answerText: string;
}

/** Splits "1. 14  2. 11  3. 16, 19" into answers by question number. */
export function splitAnswers(text: string): Map<number, string> {
  const out = new Map<number, string>();
  for (const m of text.matchAll(/(?:^|\s)(\d+)\.\s+(.*?)(?=\s+\d+\.\s|$)/g))
    out.set(Number(m[1]), m[2]!.trim());
  return out;
}

export function parseBlock(md: string): Parsed {
  const intro: string[] = [];
  const items: Parsed['items'] = [];
  let answers = new Map<number, string>();
  let answerText = '';
  let level: 'start' | 'core' | 'stretch' | undefined;
  const paras = md.split(/\n\s*\n/);
  for (const para of paras) {
    const t = para.trim();
    if (!t || DROP.test(t)) continue;
    if (ANSWER.test(t)) {
      answerText = t.replace(ANSWER, '');
      answers = splitAnswers(answerText);
      continue;
    }
    const lv = LEVELS.find((l) => l.re.test(t));
    if (lv) {
      level = lv.level;
      continue;
    }
    // A paragraph with no numbered line is an instruction: before the questions it is kept as
    // the intro, after them it is a note for the teacher and left out.
    let inList = false;
    for (const line of t.split('\n')) {
      const m = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (m) {
        items.push({ n: Number(m[1]), prompt: m[2]!, level });
        inList = true;
      } else if (inList) items[items.length - 1]!.prompt += ` ${line.trim()}`;
      else if (!items.length) intro.push(line.trim());
    }
  }
  return { intro, items, answers, answerText };
}

const item = (prompt: string, answer = '', space: PackItem['space'] = 'medium'): PackItem => ({
  prompt_md: prompt,
  answer_md: answer,
  space,
});

const plainSlide = (
  b: LessonBlock | undefined,
  kind: PackSlide['kind'],
  heading: string,
  body: string,
  answer = '',
  options: string[] = [],
): PackSlide => ({
  kind,
  block_id: b?.id ?? '',
  heading,
  body_md: body,
  options,
  writing_space: SPACE_SLIDES.includes(kind) || kind === 'reflection',
  answer_md: answer,
});

/** A pack built only from the lesson text: no AI, so it is plainer but always available. */
export function fallbackPack(lesson: Lesson): LessonPack {
  const find = (t: LessonBlock['type']) => lesson.blocks.find((b) => b.type === t);
  const guided = find('guided_practice');
  const indep = find('independent_practice');
  const exit = find('exit_ticket');
  const sections: LessonPack['worksheet']['sections'] = [];

  if (guided) {
    const p = parseBlock(guided.content_md);
    if (p.items.length)
      sections.push({
        heading: 'Practise with a partner',
        level: 'all',
        block_id: guided.id,
        items: p.items.map((i) => item(i.prompt, p.answers.get(i.n))),
      });
  }
  if (indep) {
    const p = parseBlock(indep.content_md);
    const levelled = LEVELS.filter((l) => p.items.some((i) => i.level === l.level));
    if (levelled.length)
      for (const l of levelled)
        sections.push({
          heading: l.heading,
          level: l.level,
          block_id: indep.id,
          items: p.items
            .filter((i) => i.level === l.level)
            .map((i) => item(i.prompt, p.answers.get(i.n))),
        });
    else if (p.items.length)
      sections.push({
        heading: 'On your own',
        level: 'all',
        block_id: indep.id,
        items: p.items.map((i) => item(i.prompt, p.answers.get(i.n))),
      });
  }

  const exitParsed = exit ? parseBlock(exit.content_md) : undefined;
  const exit_ticket = (exitParsed?.items ?? [])
    .slice(0, 3)
    .map((i) => item(i.prompt, exitParsed!.answers.get(i.n), 'long'));

  const slides: PackSlide[] = [titleSlide(lesson)];
  const intention = find('intention');
  if (intention) slides.push(plainSlide(intention, 'intention', 'Today', intention.content_md));
  const vocab = find('vocabulary');
  if (vocab) slides.push(plainSlide(vocab, 'vocabulary', 'Key words', vocab.content_md));
  const starter = find('prerequisites');
  if (starter) {
    const p = parseBlock(starter.content_md);
    p.items.forEach((i) =>
      slides.push(
        plainSlide(starter, 'problem', `Warm up ${i.n}`, i.prompt, p.answers.get(i.n) ?? ''),
      ),
    );
  }
  const teach = find('explicit_teaching');
  if (teach) {
    const table = teach.content_md.split('\n').filter((l) => l.trim().startsWith('|'));
    slides.push(
      plainSlide(
        teach,
        'example',
        'Worked example',
        table.length ? `Find the rule.\n\n${table.join('\n')}` : teach.title,
      ),
    );
  }
  if (guided) {
    const p = parseBlock(guided.content_md);
    p.items.forEach((i) =>
      slides.push(
        plainSlide(guided, 'problem', `Together ${i.n}`, i.prompt, p.answers.get(i.n) ?? ''),
      ),
    );
  }
  const hinge = find('check_for_understanding');
  if (hinge) {
    const p = parseBlock(hinge.content_md);
    const question = p.intro.filter((l) => l && !/^every student/i.test(l)).join(' ');
    slides.push(
      plainSlide(
        hinge,
        'hinge',
        'Show me',
        question || hinge.title,
        p.answerText,
        p.items.map((i) => i.prompt).slice(0, 4),
      ),
    );
  }
  slides.push(
    plainSlide(exit, 'reflection', 'Exit ticket', 'Answer the questions on your exit ticket.'),
  );

  return {
    steps: [],
    worksheet: {
      title: lesson.title,
      instructions: 'Show your working for every question.',
      sections,
    },
    exit_ticket,
    slides: slides.slice(0, 18),
  };
}

/** Tammy's ready-made pack, for the cached demo lesson. */
export const DEMO_PACK = groundPack(LessonPackSchema.parse(demoPackFile), DEMO_LESSON.lesson);
export const DEMO_LESSON_KEY = lessonKey(DEMO_LESSON.lesson);

/** Slide numbers (1-based) that belong to each lesson block, for the teacher guide. */
export function slidesByBlock(pack: LessonPack): Map<string, number[]> {
  const out = new Map<string, number[]>();
  pack.slides.forEach((s, i) => {
    if (!s.block_id) return;
    out.set(s.block_id, [...(out.get(s.block_id) ?? []), i + 1]);
  });
  return out;
}

/** "Slide 3" or "Slides 3 to 5". */
export function slideRange(nums: number[] | undefined): string {
  if (!nums?.length) return '';
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return lo === hi ? `Slide ${lo}` : `Slides ${lo} to ${hi}`;
}

/** Worksheet levels present in the pack, in teaching order. */
export function packLevels(pack: LessonPack): ('start' | 'core' | 'stretch')[] {
  return (['start', 'core', 'stretch'] as const).filter((l) =>
    pack.worksheet.sections.some((s) => s.level === l),
  );
}

export const LEVEL_NAMES = { all: 'All', start: 'Start here', core: 'Core', stretch: 'Stretch' };

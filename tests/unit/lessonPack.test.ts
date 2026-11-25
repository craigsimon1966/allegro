import { strFromU8, unzipSync } from 'fflate';
import { Packer } from 'docx';
import { describe, expect, it } from 'vitest';
import { DEMO_LESSON } from '@shared/lesson';
import {
  DEMO_LESSON_KEY,
  DEMO_PACK,
  fallbackPack,
  lessonKey,
  packLevels,
  slideRange,
  splitAnswers,
} from '@shared/lessonPack';
import { LessonPackSchema } from '@shared/schemas';
import { exitTicketDocument, lessonDocument, worksheetDocument } from '@/lib/lessonDocx';
import { slidesBuffer } from '@/lib/lessonSlides';
import { tokenColour } from '@/lib/printColours';

const NOTICE = 'Drafted by Allegro AI. Please check before using.';
const lesson = DEMO_LESSON.lesson;
const docText = async (d: ReturnType<typeof lessonDocument>) => {
  const files = unzipSync(new Uint8Array(await Packer.toBuffer(d)));
  const body = strFromU8(files['word/document.xml']!).replace(/<[^>]+>/g, ' ');
  const footer = Object.keys(files).find((f) => /word\/footer\d*\.xml/.test(f));
  return { body, footer: strFromU8(files[footer!]!) };
};

describe('lesson pack data', () => {
  it('the demo pack covers every lesson block and keeps slides answer-free', () => {
    expect(LessonPackSchema.safeParse(DEMO_PACK).success).toBe(true);
    expect(DEMO_PACK.steps.map((s) => s.block_id)).toEqual(lesson.blocks.map((b) => b.id));
    expect(DEMO_PACK.slides[0]!.kind).toBe('title');
    for (const s of DEMO_PACK.slides) {
      if (['example', 'problem', 'hinge'].includes(s.kind)) expect(s.writing_space).toBe(true);
      if (s.kind !== 'hinge' && s.answer_md && /=/.test(s.answer_md))
        expect(s.body_md).not.toContain(s.answer_md.split('.')[0]!);
    }
    expect(packLevels(DEMO_PACK)).toEqual(['start', 'core', 'stretch']);
    expect(JSON.stringify(DEMO_PACK)).not.toContain('—');
  });

  it('recognises the unedited demo lesson, and a changed lesson gets a new key', () => {
    expect(lessonKey(lesson)).toBe(DEMO_LESSON_KEY);
    const edited = {
      ...lesson,
      blocks: lesson.blocks.map((b, i) => (i === 0 ? { ...b, content_md: 'changed' } : b)),
    };
    expect(lessonKey(edited)).not.toBe(DEMO_LESSON_KEY);
  });

  it('splits answer lines by question number', () => {
    const a = splitAnswers('1. 14  2. 11  3. 16, 19  4. 3');
    expect([...a.entries()]).toEqual([
      [1, '14'],
      [2, '11'],
      [3, '16, 19'],
      [4, '3'],
    ]);
  });

  it('builds a plainer pack from the lesson text, with levels and answers kept apart', () => {
    const p = fallbackPack(lesson);
    expect(LessonPackSchema.safeParse(p).success).toBe(true);
    expect(packLevels(p)).toEqual(['start', 'core', 'stretch']);
    const core = p.worksheet.sections.find((s) => s.level === 'core')!;
    expect(core.items.map((i) => i.answer_md)).toEqual(['$y = 4x + 5$', '$y = 2x + 3$']);
    for (const s of p.worksheet.sections)
      for (const i of s.items) expect(i.prompt_md).not.toMatch(/answer/i);
    expect(p.exit_ticket).toHaveLength(2);
    expect(p.slides.find((s) => s.kind === 'hinge')!.options).toHaveLength(3);
    for (const s of p.slides) expect(s.body_md).not.toMatch(/\*\*answers?/i);
  });

  it('describes slide ranges in words', () => {
    expect(slideRange([4, 5, 6])).toBe('Slides 4 to 6');
    expect(slideRange([2])).toBe('Slide 2');
    expect(slideRange(undefined)).toBe('');
  });
});

describe('lesson pack files', () => {
  it('teacher guide has steps, timings, slide numbers and the answer key', async () => {
    const { body, footer } = await docText(lessonDocument(lesson, NOTICE, 'NSW', DEMO_PACK));
    for (const t of [
      'Teacher guide',
      'Lesson at a glance',
      'Step by step',
      'Answer key',
      'Say',
      'Ask',
      'Watch for',
    ])
      expect(body).toContain(t);
    expect(body).toContain('Slides 3 to 5');
    expect(body).toContain('Slides 9 to 11 · Worksheet');
    expect(body).toContain('0 to 2 min');
    expect(body).toContain('y = 4x + 5');
    expect(body).toContain(NOTICE);
    expect(footer).toContain(NOTICE);
  });

  it('worksheets are student-facing: name line, room to work and no answers', async () => {
    for (const level of ['start', 'core', 'stretch'] as const) {
      const { body, footer } = await docText(worksheetDocument(lesson, DEMO_PACK, level, NOTICE));
      expect(body).toContain('Name');
      expect(footer).toContain(NOTICE);
      for (const s of DEMO_PACK.worksheet.sections)
        for (const i of s.items) expect(body).not.toContain(i.answer_md.replace(/\$/g, ''));
    }
    const core = (await docText(worksheetDocument(lesson, DEMO_PACK, 'core', NOTICE))).body;
    expect(core).toContain('Core');
    expect(core).toContain('Practise with a partner');
    expect(core).not.toContain('Stretch');
  });

  it('exit tickets come two to a page with no answers', async () => {
    const { body } = await docText(exitTicketDocument(lesson, DEMO_PACK, NOTICE));
    expect(body.match(/Exit ticket:/g)).toHaveLength(2);
    expect(body).toContain('cut here');
    expect(body).not.toContain('y = 2x + 6');
  });

  it('slides open as a plain .pptx: one per pack slide, notice on each, no answers, no effects', async () => {
    const files = unzipSync(await slidesBuffer(lesson, DEMO_PACK, NOTICE));
    const slides = Object.keys(files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
    expect(slides).toHaveLength(DEMO_PACK.slides.length);
    const answers = DEMO_PACK.slides
      .filter((s) => s.kind !== 'hinge')
      .map((s) => s.answer_md.replace(/\$/g, '').split(/[.(]/)[0]!.trim())
      .filter((a) => /=/.test(a));
    expect(answers.length).toBeGreaterThan(3);
    for (const f of slides) {
      const xml = strFromU8(files[f]!);
      expect(xml).toContain(NOTICE);
      expect(xml).not.toMatch(/<p:transition|<p:timing/);
      expect(xml).toContain('typeface="Arial"');
      const text = xml.replace(/<[^>]+>/g, '');
      // A hinge question shows its options, and one of them is right by design.
      const n = Number(f.match(/slide(\d+)\.xml/)![1]);
      if (DEMO_PACK.slides[n - 1]!.kind === 'hinge') continue;
      for (const a of answers) expect(text).not.toContain(a);
    }
    const notes = Object.keys(files).filter((f) => /notesSlide\d+\.xml$/.test(f));
    for (const f of notes) expect(strFromU8(files[f]!)).not.toContain('y = 3x + 4');
  });

  it('reads print colours from the design tokens', () => {
    expect(tokenColour('ink', ':root { --ink: #1f2a1f; }')).toBe('1F2A1F');
    expect(() => tokenColour('nope', '')).toThrow();
  });
});

describe('reading questions from lesson text', () => {
  it('leaves teacher notes after the questions out of the last question', async () => {
    const { parseBlock } = await import('@shared/lessonPack');
    const p = parseBlock(
      'Which rule?\n\n1. a\n2. b\n\n**Answer:** 2.\n\nIf many choose 1, reteach.',
    );
    expect(p.items.map((i) => i.prompt)).toEqual(['a', 'b']);
    expect(p.intro).toEqual(['Which rule?']);
  });
});

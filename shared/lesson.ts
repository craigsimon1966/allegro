import { STATE_IDS } from './states';
import { z } from 'zod';
import { LessonSchema, Role, Situation, type Lesson, type LessonBlock } from './schemas';
import { MISCONCEPTIONS, UNITS } from './catalogue';
import { checkRefs, topicRefs } from './curriculum';
import demoLessonFile from '../content/lessons/demo-tammy-linear.json';

// Lesson Builder grounding (SPEC 7.7, TECH_SPEC 7.3). Runs on the server after the model replies,
// and in the browser for the cached demo lesson.

export const LessonRequestSchema = z.object({
  topicTag: z.string().min(1).max(60),
  yearLevel: z.string().min(1).max(10),
  durationMinutes: z.number().int().min(20).max(120),
  classProfile: z.string().max(300).default(''),
  lastLesson: z.string().max(300).optional(),
  carryIn: z.array(z.string().max(400)).max(5).optional(),
  state: z.enum(STATE_IDS).optional(),
  /** The teacher's role and situation from their profile, so the plan fits them, not a generic teacher. */
  role: Role.optional(),
  situation: z.string().max(600).optional(),
  situations: z.array(Situation).max(6).optional(),
  confidentYears: z.array(z.string().max(10)).max(13).optional(),
  newToYears: z.array(z.string().max(10)).max(13).optional(),
});
export type LessonRequest = z.infer<typeof LessonRequestSchema>;

export const BLOCK_ORDER: LessonBlock['type'][] = [
  'intention',
  'prerequisites',
  'vocabulary',
  'explicit_teaching',
  'misconceptions',
  'guided_practice',
  'check_for_understanding',
  'independent_practice',
  'exit_ticket',
];

/** Seeded misconceptions for a topic: those tagged with it, plus any its units point to. */
export const MAX_MISCONCEPTIONS = 2;

export function misconceptionsFor(topicTag: string) {
  const fromUnits = new Set(
    UNITS.filter((u) => u.tags.includes(topicTag)).flatMap((u) => u.misconceptionIds),
  );
  const own = MISCONCEPTIONS.filter((m) => m.topicTag === topicTag);
  const linked = MISCONCEPTIONS.filter((m) => m.topicTag !== topicTag && fromUnits.has(m.id));
  // Two per lesson keeps a 60-minute plan on two A4 pages; the bank order sets priority.
  return [...own, ...linked].slice(0, MAX_MISCONCEPTIONS);
}

export function misconceptionsBlock(topicTag: string, id = 'misconceptions'): LessonBlock {
  const list = misconceptionsFor(topicTag);
  const content_md = list.length
    ? list
        .map(
          (m) =>
            `**A student might say:** "${m.studentSays}"\n\n- **Why it happens:** ${m.whyItHappens}\n- **How to respond:** ${m.howToRespond}\n- **Question to find it:** ${m.diagnosticQuestion}`,
        )
        .join('\n\n')
    : 'There are no reviewed misconceptions for this topic in Allegro yet. Listen for answers that sound right but fail when students test them.';
  return {
    id,
    type: 'misconceptions',
    title: 'Common misconceptions to watch for',
    content_md,
    rationale:
      'Knowing the likely errors in advance lets you plan a question that surfaces them and a response that fixes them.',
    source: 'seeded',
    needs_maths_check: false,
  };
}

/**
 * Curriculum refs never come from the model. They are the topic's codes (content/tags.json) plus
 * its units' codes, kept only when the official list has them for this year level (or its NSW
 * stage). A topic with no code for the year gets none, rather than a code from another year.
 */
export function curriculumRefsFor(topicTag: string, yearLevel: string) {
  const units = UNITS.filter((u) => u.tags.includes(topicTag));
  const t = topicRefs(topicTag);
  const checked = checkRefs(
    {
      ac9: [...t.ac9, ...units.flatMap((u) => u.curriculumRefs.ac9)],
      nsw: [...t.nsw, ...units.flatMap((u) => u.curriculumRefs.nsw)],
      senior: t.senior ?? [],
    },
    [yearLevel],
  );
  return {
    ac9: checked.ac9.map((c) => c.code),
    nsw: checked.nsw.map((c) => c.code),
    ...(checked.senior.length ? { senior: checked.senior.map((c) => c.code) } : {}),
  };
}

/** Code-enforced rules on any lesson, whatever the model wrote. */
export function groundLesson(lesson: Lesson, topicTag: string): Lesson {
  const seen = new Set<string>();
  const blocks = lesson.blocks
    .filter((b) => b.type !== 'misconceptions')
    .map((b, i): LessonBlock => {
      let id = b.id || `b${i + 1}`;
      while (seen.has(id)) id = `${id}x`;
      seen.add(id);
      return {
        ...b,
        id,
        content_md: b.content_md.replace(/—/g, ', '),
        rationale: b.rationale.replace(/—/g, ', '),
        source: 'ai_draft' as const,
        needs_maths_check: true,
      };
    });
  const at = blocks.findIndex((b) => b.type === 'explicit_teaching');
  blocks.splice(at >= 0 ? at + 1 : blocks.length, 0, misconceptionsBlock(topicTag));
  return { ...lesson, curriculum_refs: curriculumRefsFor(topicTag, lesson.year_level), blocks };
}

/** Rough minutes per block, scaled to the lesson length, for the margin timings. */
const WEIGHT: Record<LessonBlock['type'], number> = {
  intention: 2,
  prerequisites: 5,
  vocabulary: 3,
  explicit_teaching: 12,
  misconceptions: 3,
  guided_practice: 10,
  check_for_understanding: 4,
  independent_practice: 15,
  exit_ticket: 6,
};
export function blockMinutes(lesson: Lesson): number[] {
  const total = lesson.blocks.reduce((s, b) => s + WEIGHT[b.type], 0) || 1;
  const raw = lesson.blocks.map((b) => (WEIGHT[b.type] / total) * lesson.duration_minutes);
  const mins = raw.map((m) => Math.max(1, Math.round(m)));
  // Make the timings add up to the lesson length exactly.
  let diff = lesson.duration_minutes - mins.reduce((s, m) => s + m, 0);
  for (let i = mins.length - 1; diff !== 0 && i >= 0; i--) {
    const step = diff > 0 ? 1 : mins[i]! > 1 ? -1 : 0;
    mins[i]! += step;
    diff -= step;
  }
  return mins;
}

/** Tammy's ready-made lesson, so the demo works without the AI (like the cached diagnosis). */
export const DEMO_LESSON = {
  topicTag: 'algebra.linear',
  yearLevel: '8',
  lesson: groundLesson(LessonSchema.parse(demoLessonFile), 'algebra.linear'),
};

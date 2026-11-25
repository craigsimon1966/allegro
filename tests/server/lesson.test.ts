// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import type { CompleteArgs, Completer } from '../../functions/_lib/anthropic';
import { handleLesson, handleLessonBlock, handleLessonPack } from '../../functions/_lib/lesson';
import { resetMemoryLimits } from '../../functions/_lib/ratelimit';
import { DEMO_LESSON, blockMinutes, groundLesson, misconceptionsFor } from '../../shared/lesson';
import { LessonPackSchema, LessonSchema, type Lesson } from '../../shared/schemas';

const SESSION = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-demo-session': SESSION },
    body: JSON.stringify(body),
  });

const aiLesson: Lesson = {
  lesson_id: 'x',
  title: 'Rules',
  year_level: '8',
  duration_minutes: 60,
  curriculum_refs: { ac9: ['AC9MADEUP01'], nsw: ['MA4-MADEUP'] },
  blocks: [
    {
      id: 'b1',
      type: 'intention',
      title: 'LI',
      content_md: 'We are learning — rules',
      rationale: 'r',
      source: 'seeded',
      needs_maths_check: false,
    },
    {
      id: 'b2',
      type: 'explicit_teaching',
      title: 'Teach',
      content_md: '$y = 2x$',
      rationale: 'r',
      source: 'ai_draft',
      needs_maths_check: true,
    },
    {
      id: 'b3',
      type: 'misconceptions',
      title: 'Mine',
      content_md: 'Invented error',
      rationale: 'r',
      source: 'ai_draft',
      needs_maths_check: true,
    },
    {
      id: 'b4',
      type: 'exit_ticket',
      title: 'Exit',
      content_md: 'Q',
      rationale: 'r',
      source: 'ai_draft',
      needs_maths_check: true,
    },
  ],
};

beforeEach(() => resetMemoryLimits());

describe('groundLesson', () => {
  const g = groundLesson(aiLesson, 'algebra.linear');
  it('replaces the model misconceptions with the bank, after explicit teaching', () => {
    const m = g.blocks.filter((b) => b.type === 'misconceptions');
    expect(m).toHaveLength(1);
    expect(m[0]!.source).toBe('seeded');
    expect(m[0]!.content_md).not.toContain('Invented error');
    for (const x of misconceptionsFor('algebra.linear'))
      expect(m[0]!.content_md).toContain(x.studentSays);
    expect(g.blocks[2]!.type).toBe('misconceptions');
  });
  it('takes curriculum refs from the units, never the model', () => {
    expect(g.curriculum_refs).toEqual({ ac9: ['AC9-TODO'], nsw: ['NSW-TODO'] });
  });
  it('marks every other block as an AI draft that needs a maths check, with no em dashes', () => {
    for (const b of g.blocks.filter((b) => b.type !== 'misconceptions')) {
      expect(b.source).toBe('ai_draft');
      expect(b.needs_maths_check).toBe(true);
      expect(b.content_md).not.toContain('—');
    }
  });
  it('timings add up to the lesson length', () => {
    expect(blockMinutes(DEMO_LESSON.lesson).reduce((s, m) => s + m, 0)).toBe(60);
    expect(LessonSchema.safeParse(DEMO_LESSON.lesson).success).toBe(true);
  });
});

describe('POST /api/lesson', () => {
  const body = {
    topicTag: 'algebra.linear',
    yearLevel: '8',
    durationMinutes: 60,
    classProfile: 'mixed readiness',
  };
  it('grounds the AI lesson and sends the topic units as reference', async () => {
    let seen: CompleteArgs | undefined;
    const complete: Completer = async (a) => {
      seen = a;
      return { text: JSON.stringify(aiLesson) };
    };
    const res = await handleLesson(post('/api/lesson', body), {}, { complete });
    expect(res.status).toBe(200);
    const l = LessonSchema.parse(await res.json());
    expect(l.curriculum_refs.ac9).toEqual(['AC9-TODO']);
    expect(l.lesson_id).not.toBe('x');
    expect(seen?.system).toContain('From table to rule');
    expect(seen?.model).toBe('claude-sonnet-5-5');
  });
  it('rejects unknown topics and student names', async () => {
    const complete: Completer = async () => ({ text: '{}' });
    expect(
      (await handleLesson(post('/api/lesson', { ...body, topicTag: 'nope' }), {}, { complete }))
        .status,
    ).toBe(400);
    const pii = await handleLesson(
      post('/api/lesson', {
        ...body,
        classProfile: 'One student, Jack Smith, finds algebra hard',
      }),
      {},
      { complete },
    );
    expect(pii.status).toBe(400);
  });
});

describe('POST /api/lesson-block', () => {
  const lesson = DEMO_LESSON.lesson;
  it('keeps the block id and type, whatever the model says', async () => {
    const complete: Completer = async () => ({
      text: JSON.stringify({
        id: 'other',
        type: 'intention',
        title: 'New',
        content_md: 'New text',
        rationale: 'r',
        source: 'seeded',
        needs_maths_check: false,
      }),
    });
    const res = await handleLessonBlock(
      post('/api/lesson-block', { lesson, topicTag: 'algebra.linear', blockId: 'b7' }),
      {},
      { complete },
    );
    const b = (await res.json()) as {
      id: string;
      type: string;
      source: string;
      needs_maths_check: boolean;
    };
    expect(b).toMatchObject({
      id: 'b7',
      type: 'check_for_understanding',
      source: 'ai_draft',
      needs_maths_check: true,
    });
  });
  it('never asks the model for the misconceptions block', async () => {
    let called = false;
    const complete: Completer = async () => {
      called = true;
      return { text: '{}' };
    };
    const id = lesson.blocks.find((b) => b.type === 'misconceptions')!.id;
    const res = await handleLessonBlock(
      post('/api/lesson-block', { lesson, topicTag: 'algebra.linear', blockId: id }),
      {},
      { complete },
    );
    expect(res.status).toBe(200);
    expect(called).toBe(false);
  });
});

describe('POST /api/lesson-pack', () => {
  const lesson = DEMO_LESSON.lesson;
  it('grounds the pack: known blocks only, no em dashes, a title slide first, writing space on problems', async () => {
    let system = '';
    const complete: Completer = async (args: CompleteArgs) => {
      system = args.system;
      return {
        text: JSON.stringify({
          steps: [
            { block_id: 'b2', do: ['Show — the slide'], say: [], ask: [], watch_for: [] },
            { block_id: 'nope', do: ['x'], say: [], ask: [], watch_for: [] },
          ],
          worksheet: {
            title: 'T',
            instructions: 'Show working.',
            sections: [
              {
                heading: 'Core',
                level: 'core',
                block_id: 'b8',
                items: [{ prompt_md: 'Q', answer_md: 'A', space: 'short' }],
              },
            ],
          },
          exit_ticket: [],
          slides: [
            {
              kind: 'problem',
              block_id: 'b6',
              heading: 'Q1',
              body_md: 'Find the rule',
              writing_space: false,
              answer_md: 'y = 2x',
            },
          ],
        }),
      };
    };
    const res = await handleLessonPack(post('/api/lesson-pack', { lesson }), {}, { complete });
    expect(res.status).toBe(200);
    const pack = LessonPackSchema.parse(await res.json());
    expect(system).toContain(lesson.title);
    expect(pack.steps.map((s) => s.block_id)).toEqual(['b2']);
    expect(pack.steps[0]!.do[0]).toBe('Show, the slide');
    expect(pack.slides[0]!.kind).toBe('title');
    expect(pack.slides[1]!.writing_space).toBe(true);
  });
  it('says the AI is unavailable when the model fails', async () => {
    const complete: Completer = async () => {
      throw new Error('down');
    };
    const res = await handleLessonPack(post('/api/lesson-pack', { lesson }), {}, { complete });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

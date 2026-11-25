// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import type { CompleteArgs, Completer } from '../../functions/_lib/anthropic';
import { handleLesson, handleLessonBlock } from '../../functions/_lib/lesson';
import { resetMemoryLimits } from '../../functions/_lib/ratelimit';
import { DEMO_LESSON, blockMinutes, groundLesson, misconceptionsFor } from '../../shared/lesson';
import { LessonSchema, type Lesson } from '../../shared/schemas';

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
  it('takes curriculum refs from the official list for the lesson year, never the model', () => {
    expect(g.curriculum_refs).toEqual({
      ac9: ['AC9M8A02', 'AC9M8A03', 'AC9M8A04'],
      nsw: ['MA4-LIN-C-01'],
    });
    const y9 = groundLesson({ ...aiLesson, year_level: '9' }, 'algebra.linear');
    expect(y9.curriculum_refs.ac9.every((c) => c.startsWith('AC9M9'))).toBe(true);
    expect(y9.curriculum_refs.nsw.every((c) => c.startsWith('MA5-'))).toBe(true);
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
    expect(l.curriculum_refs.ac9).toEqual(['AC9M8A02', 'AC9M8A03', 'AC9M8A04']);
    expect(l.lesson_id).not.toBe('x');
    expect(seen?.system).toContain('From table to rule');
    expect(seen?.model).toBe('claude-sonnet-5-5');
  });
  it('puts the teacher facts in the prompt as fixed rules', async () => {
    let seen: CompleteArgs | undefined;
    const complete: Completer = async (a) => {
      seen = a;
      return { text: JSON.stringify(aiLesson) };
    };
    await handleLesson(
      post('/api/lesson', { ...body, role: 'out_of_field', situation: 'PE teacher, new to maths' }),
      {},
      { complete },
    );
    const msg = String(seen?.messages[0]?.content);
    expect(msg).toContain('Fixed facts from the teacher');
    expect(msg).toContain('Year 8');
    expect(msg).toContain('outside their trained subject');
    expect(msg).toContain('PE teacher, new to maths');
  });
  it('refuses a topic that is not taught in the chosen year, before any AI call', async () => {
    let called = false;
    const complete: Completer = async () => {
      called = true;
      return { text: '{}' };
    };
    const res = await handleLesson(
      post('/api/lesson', { ...body, topicTag: 'algebra.linear', yearLevel: '3' }),
      {},
      { complete },
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { reason: string } }).error.reason).toBe('topic_year');
    expect(called).toBe(false);
  });
  it('sends a lesson written for another year back to be redone', async () => {
    const replies = [
      { ...aiLesson, year_level: '10' },
      { ...aiLesson, year_level: '8' },
    ];
    let calls = 0;
    const complete: Completer = async () => ({ text: JSON.stringify(replies[calls++]) });
    const res = await handleLesson(post('/api/lesson', body), {}, { complete });
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
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

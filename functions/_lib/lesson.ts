import { z } from 'zod';
import {
  LessonBlockSchema,
  PackGuidePartSchema,
  PackSlidesPartSchema,
  LessonSchema,
  type LessonPack,
  type Lesson,
} from '../../shared/schemas';
import { fallbackPack, groundPack } from '../../shared/lessonPack';
import { LessonRequestSchema, groundLesson, misconceptionsBlock } from '../../shared/lesson';
import { UNITS } from '../../shared/catalogue';
import { tagById } from '../../shared/tags';
import { curriculumContext } from '../../shared/states';
import { topicFitsYear, yearLabel } from '../../shared/curriculum';
import { ROLE_PROMPT, situationFacts } from '../../shared/profile';
import { findLikelyStudentNames } from '../../shared/pii';
import { hasAccess } from './access';
import { anthropicCompleter, generateJson, type Completer } from './anthropic';
import { identify, type Subject } from './auth';
import { LONG_CALL, MAX_TOKENS, mainModel, type Env } from './env';
import { buildPrompt } from './prompts';
import { checkRateLimit, logAiCall } from './ratelimit';
import { error, json } from './respond';

// POST /api/lesson and /api/lesson-block (SPEC 7.7, TECH_SPEC 7.2, 7.3).

export interface Deps {
  complete?: Completer;
  fetch?: typeof fetch;
}

type Gate = { ok: true; subject: Subject; body: unknown } | { ok: false; res: Response };

async function gate(request: Request, env: Env, fetchImpl: typeof fetch): Promise<Gate> {
  if (!(await hasAccess(request, env)))
    return { ok: false, res: error('unauthorised', 'Please enter the demo access code first.') };
  const subject = await identify(request, env, fetchImpl);
  if (!subject)
    return {
      ok: false,
      res: error('unauthorised', 'Please sign in or choose a demo teacher first.'),
    };
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, res: error('invalid_input', 'We could not read that request.') };
  }
  const wait = await checkRateLimit(subject, env, fetchImpl);
  if (wait)
    return {
      ok: false,
      res: error(
        'rate_limited',
        "You've reached this hour's limit. Please try again a little later.",
        { retryAfterSeconds: wait },
      ),
    };
  return { ok: true, subject, body };
}

const namesIn = (...texts: (string | undefined)[]) =>
  findLikelyStudentNames(texts.filter(Boolean).join('\n')).length > 0;

const PII = () =>
  error(
    'invalid_input',
    "It looks like this includes a student's name. Please describe the class in general terms only.",
    { reason: 'student_pii' },
  );

/** Reference text for the prompt: the topic's own units (core ideas and worked examples). */
export function referenceFor(topicTag: string): string {
  return UNITS.filter((u) => u.tags.includes(topicTag))
    .map((u) => [`## ${u.title}`, u.coreIdeaMd, u.workedExampleMd ?? ''].join('\n\n'))
    .join('\n\n')
    .slice(0, 8000);
}

export async function handleLesson(request: Request, env: Env, deps: Deps = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const g = await gate(request, env, fetchImpl);
  if (!g.ok) return g.res;
  const parsed = LessonRequestSchema.safeParse(g.body);
  if (!parsed.success) return error('invalid_input', 'Please check the lesson details.');
  const req = parsed.data;
  const tag = tagById(req.topicTag);
  if (!tag) return error('invalid_input', 'Please choose a topic from the list.');
  // A topic is only planned for a year it is taught in (content/tags.json, checked against AC v9).
  if (!topicFitsYear(req.topicTag, req.yearLevel))
    return error(
      'invalid_input',
      `${tag.label} isn't taught in ${yearLabel(req.yearLevel)}. Please choose a topic for that year.`,
      { reason: 'topic_year' },
    );
  if (namesIn(req.classProfile, req.lastLesson, req.situation, ...(req.carryIn ?? [])))
    return PII();

  const parts = [
    curriculumContext(req.state),
    `Fixed facts from the teacher (follow them exactly; never change them):`,
    `- Year level: ${yearLabel(req.yearLevel)}. Every question, example and number must suit ${yearLabel(req.yearLevel)} students. Do not use content from a later year. year_level must be "${req.yearLevel}".`,
    req.role ? `- The teacher: ${ROLE_PROMPT[req.role]}` : '',
    ...situationFacts({
      situations: req.situations,
      confidentYears: req.confidentYears,
      newToYears: req.newToYears,
    }),
    req.newToYears?.includes(req.yearLevel)
      ? `- ${yearLabel(req.yearLevel)} is new to them, so explain what students at this level typically know and find hard.`
      : '',
    req.situation ? `- Their situation, in summary: ${req.situation}` : '',
    `Topic: ${tag.label}`,
    `Lesson length: ${req.durationMinutes} minutes`,
    `Class profile (general): ${req.classProfile || 'not given'}`,
    req.lastLesson ? `Covered last lesson: ${req.lastLesson}` : '',
    req.carryIn?.length ? `Moves to include:\n${req.carryIn.map((m) => `- ${m}`).join('\n')}` : '',
  ].filter(Boolean);

  const model = mainModel(env);
  const result = await generateJson(
    deps.complete ?? anthropicCompleter(env, LONG_CALL),
    {
      model,
      system: buildPrompt('lesson', { REFERENCE: referenceFor(req.topicTag) || 'none' }),
      messages: [{ role: 'user', content: parts.join('\n') }],
      maxTokens: MAX_TOKENS.lesson,
    },
    // Post-check: a plan written for another year is sent back once to be redone.
    LessonSchema.refine((l) => l.year_level.replace(/^year\s*/i, '') === req.yearLevel, {
      message: `year_level must be "${req.yearLevel}": the whole lesson is for ${yearLabel(req.yearLevel)}`,
      path: ['year_level'],
    }),
  );
  await logAiCall(
    g.subject,
    env,
    {
      endpoint: 'lesson',
      model,
      inputTokens: result.usage.input,
      outputTokens: result.usage.output,
      ok: result.ok,
    },
    fetchImpl,
  );
  if (!result.ok)
    return result.code === 'ai_unavailable'
      ? error('ai_unavailable', "Allegro's AI isn't available right now. Please try again later.")
      : error('ai_invalid_output', "We couldn't make sense of the AI's reply. Please try again.");
  const lesson: Lesson = {
    ...result.data,
    lesson_id: crypto.randomUUID(),
    year_level: req.yearLevel,
    duration_minutes: req.durationMinutes,
  };
  return json(groundLesson(lesson, req.topicTag));
}

export const LessonBlockRequestSchema = z.object({
  lesson: LessonSchema,
  topicTag: z.string().min(1).max(60),
  blockId: z.string().min(1),
  instruction: z.string().max(300).optional(),
});

export async function handleLessonBlock(request: Request, env: Env, deps: Deps = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const g = await gate(request, env, fetchImpl);
  if (!g.ok) return g.res;
  const parsed = LessonBlockRequestSchema.safeParse(g.body);
  if (!parsed.success) return error('invalid_input', 'We could not read that request.');
  const { lesson, topicTag, blockId, instruction } = parsed.data;
  const block = lesson.blocks.find((b) => b.id === blockId);
  if (!block) return error('invalid_input', 'We could not find that block.');
  // The misconceptions block is never written by the model.
  if (block.type === 'misconceptions') return json(misconceptionsBlock(topicTag, block.id));
  if (namesIn(instruction)) return PII();

  const model = mainModel(env);
  const result = await generateJson(
    deps.complete ?? anthropicCompleter(env),
    {
      model,
      system: buildPrompt('lesson-block', { LESSON: JSON.stringify(lesson) }),
      messages: [
        {
          role: 'user',
          content: `Redo the block with id "${block.id}" (type ${block.type}, "${block.title}").${
            instruction ? ` Instruction: ${instruction}` : ''
          }`,
        },
      ],
      maxTokens: MAX_TOKENS['lesson-block'],
    },
    LessonBlockSchema,
  );
  await logAiCall(
    g.subject,
    env,
    {
      endpoint: 'lesson-block',
      model,
      inputTokens: result.usage.input,
      outputTokens: result.usage.output,
      ok: result.ok,
    },
    fetchImpl,
  );
  if (!result.ok)
    return error('ai_unavailable', "Allegro couldn't redo that block right now. Please try again.");
  return json({
    ...result.data,
    id: block.id,
    type: block.type,
    content_md: result.data.content_md.replace(/—/g, ', '),
    rationale: result.data.rationale.replace(/—/g, ', '),
    source: 'ai_draft',
    needs_maths_check: true,
  });
}

export const LessonPackRequestSchema = z.object({ lesson: LessonSchema });

/** POST /api/lesson-pack: worksheets, teacher steps and smart board slides for a finished lesson. */
export async function handleLessonPack(request: Request, env: Env, deps: Deps = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const g = await gate(request, env, fetchImpl);
  if (!g.ok) return g.res;
  const parsed = LessonPackRequestSchema.safeParse(g.body);
  if (!parsed.success) return error('invalid_input', 'We could not read that request.');
  const { lesson } = parsed.data;

  const model = mainModel(env);
  const complete = deps.complete ?? anthropicCompleter(env, LONG_CALL);
  const ask = <T>(
    endpoint: 'lesson-pack' | 'lesson-slides',
    what: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  ) =>
    generateJson(
      complete,
      {
        model,
        system: buildPrompt(endpoint, { LESSON: JSON.stringify(lesson) }),
        messages: [
          {
            role: 'user',
            content: `Make the ${what} for this Year ${lesson.year_level}, ${lesson.duration_minutes}-minute lesson.`,
          },
        ],
        maxTokens: MAX_TOKENS[endpoint],
      },
      schema,
    ).then(async (result) => {
      await logAiCall(
        g.subject,
        env,
        {
          endpoint,
          model,
          inputTokens: result.usage.input,
          outputTokens: result.usage.output,
          ok: result.ok,
        },
        fetchImpl,
      );
      return result;
    });

  // Two replies side by side: each stays well inside its token limit, and the wait is the
  // longer of the two, not the sum.
  const [guide, slides] = await Promise.all([
    ask('lesson-pack', 'teacher steps and worksheets', PackGuidePartSchema),
    ask('lesson-slides', 'smart board slides', PackSlidesPartSchema),
  ]);
  if (!guide.ok && !slides.ok)
    return error('ai_unavailable', "Allegro couldn't draft the worksheets and slides right now.");
  // If one half failed, that half is built from the lesson text, and the teacher is told.
  const plainPack = fallbackPack(lesson);
  const pack: LessonPack = {
    ...(guide.ok
      ? guide.data
      : {
          steps: plainPack.steps,
          worksheet: plainPack.worksheet,
          exit_ticket: plainPack.exit_ticket,
        }),
    slides: slides.ok ? slides.data.slides : plainPack.slides,
    ...(guide.ok && slides.ok
      ? {}
      : {
          plain: [
            ...(guide.ok ? [] : ['guide' as const]),
            ...(slides.ok ? [] : ['slides' as const]),
          ],
        }),
  };
  return json(groundPack(pack, lesson));
}

import { z } from 'zod';
import { Role } from '../../shared/schemas';
import { STATE_IDS, curriculumContext } from '../../shared/states';
import { yearLabel } from '../../shared/curriculum';
import { ROLE_PROMPT } from '../../shared/profile';
import { unitFitsYears } from '../../shared/pathway';
import { UNITS, unitById } from '../../shared/catalogue';
import { findLikelyStudentNames } from '../../shared/pii';
import { hasAccess } from './access';
import { anthropicCompleter, generateJson, type Completer } from './anthropic';
import { identify, type Subject } from './auth';
import { MAX_TOKENS, fastModel, type Env } from './env';
import { buildPrompt } from './prompts';
import { checkRateLimit, logAiCall } from './ratelimit';
import { error, json } from './respond';

// POST /api/help (SPEC 7.8) and POST /api/reflect (SPEC 7.9). Both on the fast model.

export interface Deps {
  complete?: Completer;
  fetch?: typeof fetch;
}

export const unitList = () =>
  UNITS.map(
    (u) =>
      `- ${u.id}: ${u.title} [${u.tags.join(', ')}]${u.yearLevels.length ? ` (Years ${u.yearLevels.join(', ')})` : ''}`,
  ).join('\n');

const noDash = (s: string) => s.replace(/—/g, ', ').trim();

/** Keeps the default answer under the word limit by dropping whole trailing sentences. */
export function capWords(text: string, max = 120): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text.trim();
  const sentences = text.trim().match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().split(/\s+/).length > max) break;
    out += s;
  }
  return out.trim() || words.slice(0, max).join(' ');
}

type Started = { res: Response } | { subject: Subject; body: unknown };

async function start(request: Request, env: Env, fetchImpl: typeof fetch): Promise<Started> {
  if (!(await hasAccess(request, env)))
    return { res: error('unauthorised', 'Please enter the demo access code first.') };
  const subject = await identify(request, env, fetchImpl);
  if (!subject)
    return { res: error('unauthorised', 'Please sign in or choose a demo teacher first.') };
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { res: error('invalid_input', 'We could not read that request.') };
  }
  return { subject, body };
}

const PII = () =>
  error(
    'invalid_input',
    "It looks like this includes a student's name. Please remove names and personal details, then try again.",
    { reason: 'student_pii' },
  );
const LIMIT = (wait: number) =>
  error('rate_limited', "You've reached this hour's limit. Please try again a little later.", {
    retryAfterSeconds: wait,
  });

export const HelpRequestSchema = z.object({
  question: z.string().trim().min(3).max(600),
  context: z
    .object({
      unitId: z.string().optional(),
      yearLevel: z.string().optional(),
      yearLevels: z.array(z.string().max(10)).max(13).optional(),
      role: Role.optional(),
      state: z.enum(STATE_IDS).optional(),
    })
    .optional(),
});
const HelpReplySchema = z.object({
  answer: z.string().min(1),
  tryTomorrow: z.string().optional(),
  detail: z.string().optional(),
  unitId: z.string().nullable().optional(),
});

export async function handleHelp(request: Request, env: Env, deps: Deps = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const s = await start(request, env, fetchImpl);
  if ('res' in s) return s.res;
  const parsed = HelpRequestSchema.safeParse(s.body);
  if (!parsed.success)
    return error('invalid_input', 'Please ask a question of 600 characters or fewer.');
  const req = parsed.data;
  if (findLikelyStudentNames(req.question).length) return PII();
  const wait = await checkRateLimit(s.subject, env, fetchImpl);
  if (wait) return LIMIT(wait);

  const model = fastModel(env);
  const years = req.context?.yearLevels?.length
    ? req.context.yearLevels
    : req.context?.yearLevel
      ? [req.context.yearLevel]
      : [];
  const ctx = [
    curriculumContext(req.context?.state),
    years.length
      ? `Fixed fact: they teach ${years.map(yearLabel).join(', ')}. Keep examples to these years.`
      : '',
    req.context?.role ? `The teacher is ${ROLE_PROMPT[req.context.role]}` : '',
    req.context?.unitId && unitById(req.context.unitId)
      ? `They are working on the unit "${unitById(req.context.unitId)!.title}".`
      : '',
  ].filter(Boolean);
  const result = await generateJson(
    deps.complete ?? anthropicCompleter(env),
    {
      model,
      system: buildPrompt('help', { UNIT_LIST: unitList() }),
      messages: [{ role: 'user', content: [...ctx, `Question: ${req.question}`].join('\n') }],
      maxTokens: MAX_TOKENS.help,
    },
    HelpReplySchema,
  );
  await logAiCall(
    s.subject,
    env,
    {
      endpoint: 'help',
      model,
      inputTokens: result.usage.input,
      outputTokens: result.usage.output,
      ok: result.ok,
    },
    fetchImpl,
  );
  if (!result.ok)
    return error(
      'ai_unavailable',
      "Allegro's AI isn't available right now. Please try again later.",
    );
  const r = result.data;
  return json({
    answer: capWords(noDash(r.answer)),
    tryTomorrow: noDash(r.tryTomorrow ?? ''),
    detail: noDash(r.detail ?? ''),
    // A suggested unit must exist and suit the teacher's years.
    unitId:
      r.unitId && unitById(r.unitId) && unitFitsYears(unitById(r.unitId)!, years) ? r.unitId : null,
  });
}

export const ReflectRequestSchema = z.object({
  tried: z.string().max(1000).default(''),
  happened: z.string().max(1000).default(''),
  nextTime: z.string().max(1000).default(''),
  needs: z
    .array(z.object({ topic: z.string().max(200), tags: z.array(z.string()).max(10) }))
    .max(10)
    .default([]),
});
const ReflectReplySchema = z.object({
  observation: z.string().min(1),
  suggestedUnitId: z.string().nullable().optional(),
});

export async function handleReflect(request: Request, env: Env, deps: Deps = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const s = await start(request, env, fetchImpl);
  if ('res' in s) return s.res;
  const parsed = ReflectRequestSchema.safeParse(s.body);
  if (!parsed.success) return error('invalid_input', 'We could not read that reflection.');
  const req = parsed.data;
  if (findLikelyStudentNames([req.tried, req.happened, req.nextTime].join('\n')).length)
    return PII();
  const wait = await checkRateLimit(s.subject, env, fetchImpl);
  if (wait) return LIMIT(wait);

  const model = fastModel(env);
  const needs = req.needs.map((n) => `${n.topic} [${n.tags.join(', ')}]`).join('; ') || 'not given';
  const result = await generateJson(
    deps.complete ?? anthropicCompleter(env),
    {
      model,
      system: buildPrompt('reflect', { NEEDS: needs, UNIT_LIST: unitList() }),
      messages: [
        {
          role: 'user',
          content: `What I tried: ${req.tried || '(blank)'}\nWhat happened for students: ${req.happened || '(blank)'}\nWhat I will keep or change: ${req.nextTime || '(blank)'}`,
        },
      ],
      maxTokens: MAX_TOKENS.reflect,
    },
    ReflectReplySchema,
  );
  await logAiCall(
    s.subject,
    env,
    {
      endpoint: 'reflect',
      model,
      inputTokens: result.usage.input,
      outputTokens: result.usage.output,
      ok: result.ok,
    },
    fetchImpl,
  );
  if (!result.ok)
    return error(
      'ai_unavailable',
      "Allegro's AI isn't available right now. Your reflection is still saved.",
    );
  const r = result.data;
  return json({
    observation: capWords(noDash(r.observation), 60),
    suggestedUnitId: r.suggestedUnitId && unitById(r.suggestedUnitId) ? r.suggestedUnitId : null,
  });
}

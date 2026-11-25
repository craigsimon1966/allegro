import { z } from 'zod';
import { unitById } from '../../shared/catalogue';
import { findLikelyStudentNames } from '../../shared/pii';
import type { MicroUnit } from '../../shared/types';
import { hasAccess } from './access';
import { anthropicCompleter, type Completer } from './anthropic';
import { identify } from './auth';
import { MAX_TOKENS, fastModel, type Env } from './env';
import { buildPrompt } from './prompts';
import { checkRateLimit, logAiCall } from './ratelimit';
import { error } from './respond';

// POST /api/explain (SPEC 7.6, TECH_SPEC 7.2, 7.3). The prompt carries only the unit's own text.

export const ExplainRequestSchema = z.object({
  unitId: z.string().min(1).max(100),
  style: z.enum(['simpler', 'different_context']),
  context: z.string().max(300).optional(),
});

export interface Deps {
  complete?: Completer;
  fetch?: typeof fetch;
}

/** The unit's teaching text, and nothing else, as the model's only source. */
export function unitSource(u: MicroUnit): string {
  return [
    `Title: ${u.title}`,
    `Hook: ${u.hook}`,
    `Core idea:\n${u.coreIdeaMd}`,
    u.workedExampleMd ? `Worked example:\n${u.workedExampleMd}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function handleExplain(
  request: Request,
  env: Env,
  deps: Deps = {},
): Promise<Response> {
  const fetchImpl = deps.fetch ?? fetch;
  if (!(await hasAccess(request, env)))
    return error('unauthorised', 'Please enter the demo access code first.');
  const subject = await identify(request, env, fetchImpl);
  if (!subject) return error('unauthorised', 'Please sign in or choose a demo teacher first.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('invalid_input', 'We could not read that request.');
  }
  const parsed = ExplainRequestSchema.safeParse(body);
  if (!parsed.success) return error('invalid_input', 'We could not read that request.');
  const req = parsed.data;
  const unit = unitById(req.unitId);
  if (!unit) return error('invalid_input', 'We could not find that unit.');
  if (req.context && findLikelyStudentNames(req.context).length)
    return error(
      'invalid_input',
      "It looks like this includes a student's name. Please remove it and try again.",
      { reason: 'student_pii' },
    );

  const wait = await checkRateLimit(subject, env, fetchImpl);
  if (wait)
    return error(
      'rate_limited',
      "You've reached this hour's limit. Please try again a little later.",
      {
        retryAfterSeconds: wait,
      },
    );

  const model = fastModel(env);
  const complete = deps.complete ?? anthropicCompleter(env);
  let text = '';
  let ok = false;
  let usage = { input: 0, output: 0 };
  try {
    const reply = await complete({
      model,
      system: buildPrompt('explain', { STYLE: req.style, UNIT_TEXT: unitSource(unit) }),
      messages: [
        {
          role: 'user',
          content: req.context
            ? `Please explain the core idea another way. A note about my class: ${req.context}`
            : 'Please explain the core idea another way.',
        },
      ],
      maxTokens: MAX_TOKENS.explain,
    });
    usage = { input: reply.inputTokens ?? 0, output: reply.outputTokens ?? 0 };
    text = reply.text.replace(/—/g, ', ').trim();
    ok = text.length > 0;
  } catch {
    ok = false;
  }
  await logAiCall(
    subject,
    env,
    { endpoint: 'explain', model, inputTokens: usage.input, outputTokens: usage.output, ok },
    fetchImpl,
  );
  if (!ok)
    return error(
      'ai_unavailable',
      "Allegro's AI isn't available right now. Please try again later.",
    );
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

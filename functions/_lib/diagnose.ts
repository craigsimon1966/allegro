import {
  DiagnoseRequestSchema,
  DiagnosisSchema,
  type Diagnosis,
  type DiagnoseRequest,
} from '../../shared/schemas';
import { TAGS, filterTags } from '../../shared/tags';
import { findLikelyStudentNames } from '../../shared/pii';
import { hasAccess } from './access';
import { anthropicCompleter, generateJson, type Completer } from './anthropic';
import { identify } from './auth';
import { MAX_TOKENS, mainModel, type Env } from './env';
import { buildPrompt } from './prompts';
import { checkRateLimit, logAiCall } from './ratelimit';
import { error, json } from './respond';

export interface Deps {
  complete?: Completer;
  fetch?: typeof fetch;
}

/** Turns the request into the user message. Only the situation text and guided answers go to the model. */
export function userMessage(req: DiagnoseRequest): string {
  const parts = [`Teacher's description of their situation:\n"""\n${req.situationText}\n"""`];
  if (req.guided && Object.keys(req.guided).length) {
    parts.push(`Guided answers (JSON): ${JSON.stringify(req.guided)}`);
  }
  if (req.clarifyingAnswers?.length) {
    parts.push(
      `Answers to your clarifying questions:\n${req.clarifyingAnswers.map((a) => `- ${a}`).join('\n')}`,
    );
  }
  return parts.join('\n\n');
}

/** Code-enforced grounding (TECH_SPEC 7.3) on top of the prompt rules. */
export function cleanDiagnosis(d: Diagnosis): Diagnosis {
  let nowCount = 0;
  const needs = d.needs
    .map((n, i) => ({
      ...n,
      id: n.id || `need-${i + 1}`,
      catalogue_tags: filterTags(n.catalogue_tags),
    }))
    .slice(0, 8)
    .map((n) => {
      if (n.priority !== 'now') return n;
      nowCount += 1;
      return nowCount > 3 ? { ...n, priority: 'soon' as const } : n;
    });
  return { ...d, needs, clarifying_questions: d.clarifying_questions.slice(0, 2) };
}

export async function handleDiagnose(
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
  const parsed = DiagnoseRequestSchema.safeParse(body);
  if (!parsed.success)
    return error('invalid_input', 'Please describe your situation in 4,000 characters or fewer.');
  const req = parsed.data;

  // Server-side backstop for the student-name warning (TECH_SPEC 5.4).
  const textToCheck = [req.situationText, ...(req.clarifyingAnswers ?? [])].join('\n');
  if (findLikelyStudentNames(textToCheck).length) {
    return error(
      'invalid_input',
      "It looks like this includes a student's name. Please remove names and personal details, then try again.",
      { reason: 'student_pii' },
    );
  }

  const wait = await checkRateLimit(subject, env, fetchImpl);
  if (wait)
    return error(
      'rate_limited',
      "You've reached this hour's limit. Please try again a little later.",
      { retryAfterSeconds: wait },
    );

  const model = mainModel(env);
  const tagList = TAGS.map((t) => `- ${t.id} (${t.domain}): ${t.label}`).join('\n');
  const result = await generateJson(
    deps.complete ?? anthropicCompleter(env),
    {
      model,
      system: buildPrompt('diagnose', { TAG_LIST: tagList }),
      messages: [{ role: 'user', content: userMessage(req) }],
      maxTokens: MAX_TOKENS.diagnose,
    },
    DiagnosisSchema,
  );
  await logAiCall(
    subject,
    env,
    {
      endpoint: 'diagnose',
      model,
      inputTokens: result.usage.input,
      outputTokens: result.usage.output,
      ok: result.ok,
    },
    fetchImpl,
  );

  if (!result.ok) {
    return result.code === 'ai_unavailable'
      ? error(
          'ai_unavailable',
          "Allegro's AI isn't available right now. You can use the guided questions instead.",
        )
      : error(
          'ai_invalid_output',
          "We couldn't make sense of the AI's reply. You can use the guided questions instead.",
        );
  }
  return json(cleanDiagnosis(result.data));
}

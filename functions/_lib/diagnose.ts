import {
  DiagnoseRequestSchema,
  DiagnosisSchema,
  type Diagnosis,
  type DiagnoseRequest,
} from '../../shared/schemas';
import { TAGS, filterTags } from '../../shared/tags';
import { topicFitsYear, yearLabel } from '../../shared/curriculum';
import { stateById } from '../../shared/states';
import type { Guided } from '../../shared/schemas';
import { findLikelyStudentNames } from '../../shared/pii';
import { hasAccess } from './access';
import { anthropicCompleter, generateJson, type Completer } from './anthropic';
import { identify } from './auth';
import { LONG_CALL, MAX_TOKENS, mainModel, type Env } from './env';
import { buildPrompt } from './prompts';
import { checkRateLimit, logAiCall } from './ratelimit';
import { error, json } from './respond';

export interface Deps {
  complete?: Completer;
  fetch?: typeof fetch;
}

/** The guided answers as plain facts the model must keep, not hints it may override. */
export function fixedFacts(g: Guided | undefined): string {
  if (!g) return '';
  const facts = [
    g.yearLevels?.length ? `Year levels they teach: ${g.yearLevels.map(yearLabel).join(', ')}` : '',
    g.role ? `Role: ${g.role}` : '',
    g.state ? `State: ${stateById(g.state)?.name ?? g.state}` : '',
    g.subject ? `Subject: ${g.subject}` : '',
    g.locationType ? `School location: ${g.locationType}` : '',
    g.schoolType ? `School type: ${g.schoolType}` : '',
    g.hoursPerWeek ? `Time for learning: ${g.hoursPerWeek} hours a week` : '',
  ].filter(Boolean);
  return facts.length
    ? `Fixed facts the teacher chose (copy them into context exactly; never contradict them; only choose content tags taught in these year levels):\n${facts.map((f) => `- ${f}`).join('\n')}`
    : '';
}

/** Turns the request into the user message. Only the situation text and guided answers go to the model. */
export function userMessage(req: DiagnoseRequest): string {
  const parts = [`Teacher's description of their situation:\n"""\n${req.situationText}\n"""`];
  const facts = fixedFacts(req.guided);
  if (facts) parts.push(facts);
  if (req.clarifyingAnswers?.length) {
    parts.push(
      `Answers to your clarifying questions:\n${req.clarifyingAnswers.map((a) => `- ${a}`).join('\n')}`,
    );
  }
  return parts.join('\n\n');
}

/** The teacher's own answers replace whatever the model inferred about them. */
export function forceContext(
  context: Diagnosis['context'],
  g: Guided | undefined,
): Diagnosis['context'] {
  if (!g) return context;
  return {
    ...context,
    ...(g.yearLevels?.length ? { year_levels: g.yearLevels } : {}),
    ...(g.role ? { role: g.role } : {}),
    ...(g.subject ? { subject: g.subject } : {}),
    ...(g.locationType ? { location_type: g.locationType } : {}),
    ...(g.schoolType ? { school_type: g.schoolType } : {}),
    ...(g.weeks !== undefined ? { timeframe_weeks: g.weeks } : {}),
    ...(g.hoursPerWeek ? { hours_per_week: g.hoursPerWeek } : {}),
  };
}

/** Code-enforced grounding (TECH_SPEC 7.3) on top of the prompt rules. */
export function cleanDiagnosis(d: Diagnosis, guided?: Guided): Diagnosis {
  const context = forceContext(d.context, guided);
  const years = context.year_levels;
  // A topic from another year never reaches the teacher, whatever the model chose.
  const fitsYears = (tag: string) => !years.length || years.some((y) => topicFitsYear(tag, y));
  let nowCount = 0;
  const needs = d.needs
    .map((n, i) => ({
      ...n,
      id: n.id || `need-${i + 1}`,
      catalogue_tags: filterTags(n.catalogue_tags).filter(fitsYears),
    }))
    .slice(0, 8)
    .map((n) => {
      if (n.priority !== 'now') return n;
      nowCount += 1;
      return nowCount > 3 ? { ...n, priority: 'soon' as const } : n;
    });
  return { ...d, context, needs, clarifying_questions: d.clarifying_questions.slice(0, 2) };
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
  const tagList = TAGS.map(
    (t) =>
      `- ${t.id} (${t.domain}${t.yearLevels.length ? `, ${t.yearLevels.map(yearLabel).join(', ')}` : ', any year'}): ${t.label}`,
  ).join('\n');
  const result = await generateJson(
    deps.complete ?? anthropicCompleter(env, LONG_CALL),
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
  return json(cleanDiagnosis(result.data, req.guided));
}

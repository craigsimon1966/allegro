import { z } from 'zod';
import { UNITS } from '../../shared/catalogue';
import { buildPathway, orderNeeds, unitFitsYears, type PathwayItem } from '../../shared/pathway';
import { Role, Situation } from '../../shared/schemas';
import { ROLE_PROMPT, situationFacts } from '../../shared/profile';
import { yearLabel } from '../../shared/curriculum';
import { findLikelyStudentNames } from '../../shared/pii';
import { APPROVED_SOURCES, sourcesFor } from '../../shared/sources';
import { STATE_IDS, curriculumContext } from '../../shared/states';
import { hasAccess } from './access';
import { anthropicCompleter, generateJson, type Completer } from './anthropic';
import { identify } from './auth';
import { LONG_CALL, MAX_TOKENS, mainModel, type Env } from './env';
import { buildPrompt } from './prompts';
import { checkRateLimit, logAiCall } from './ratelimit';
import { error, json } from './respond';

// POST /api/pathway (SPEC 8.3, TECH_SPEC 7.2 and 7.3). The AI chooses and explains; the code
// keeps only real units, enforces the hours and the days, and falls back to rules.

export interface Deps {
  complete?: Completer;
  fetch?: typeof fetch;
}

export const PathwayRequestSchema = z.object({
  needs: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        topic: z.string().max(200),
        evidence: z.string().max(600),
        priority: z.enum(['now', 'soon', 'later']),
        catalogue_tags: z.array(z.string().max(80)).max(12),
        concern: z.number().int().min(1).max(5).nullable().optional(),
      }),
    )
    .min(1)
    .max(8),
  hoursPerWeek: z.number().min(0.25).max(20),
  teachingDaysPerWeek: z.number().int().min(1).max(5).nullable().optional(),
  situations: z.array(Situation).max(6).optional(),
  confidentYears: z.array(z.string().max(10)).max(13).optional(),
  newToYears: z.array(z.string().max(10)).max(13).optional(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  yearLevels: z.array(z.string().max(20)).max(13).optional(),
  state: z.enum(STATE_IDS).optional(),
  role: Role.optional(),
  locationType: z.enum(['metro', 'regional', 'rural', 'remote', 'unknown']).optional(),
});
export type PathwayRequest = z.infer<typeof PathwayRequestSchema>;

const PathwayReplySchema = z.object({
  items: z.array(z.object({ unitId: z.string(), needId: z.string(), reason: z.string() })),
  external: z.array(z.object({ sourceId: z.string(), reason: z.string() })).default([]),
});

export interface PathwayResponse {
  items: PathwayItem[];
  external: { sourceId: string; reason: string }[];
  /** 'ai' when the AI's choices survived the checks, 'rules' when the code fell back. */
  source: 'ai' | 'rules';
}

/** The compact listing the prompt gets: only units that match the needs' tags (TECH_SPEC 7.5). */
export function catalogueFor(req: PathwayRequest): string {
  const tags = new Set(req.needs.flatMap((n) => n.catalogue_tags));
  return UNITS.filter((u) => u.tags.some((t) => tags.has(t)) && unitFitsYears(u, req.yearLevels))
    .map(
      (u) =>
        `- ${u.id}: ${u.title} | ${u.domain} | tags ${u.tags.join(', ')} | ${u.durationMinutes} min | difficulty ${u.difficulty} | for ${u.audience.join(', ')}`,
    )
    .join('\n');
}

export function userMessage(req: PathwayRequest): string {
  const needs = orderNeeds(req.needs)
    .map(
      (n) =>
        `- ${n.id} (${n.priority}${n.concern ? `, concern ${n.concern} of 5` : ''}): ${n.topic}. Evidence: "${n.evidence}". Tags: ${n.catalogue_tags.join(', ')}`,
    )
    .join('\n');
  const facts = [
    req.yearLevels?.length
      ? `- Year levels taught: ${req.yearLevels.map(yearLabel).join(', ')}. Only choose units for these years.`
      : '',
    req.role ? `- The teacher is ${ROLE_PROMPT[req.role]}` : '',
    ...situationFacts({
      situations: req.situations,
      confidentYears: req.confidentYears,
      newToYears: req.newToYears,
      daysPerWeek: req.teachingDaysPerWeek,
    }),
    req.locationType && req.locationType !== 'unknown'
      ? `- School location: ${req.locationType}`
      : '',
    req.needs.some((n) => n.concern)
      ? "- Concern ratings are the teacher's own (5 is a big concern). Put the biggest concerns first."
      : '',
  ].filter(Boolean);
  return [
    curriculumContext(req.state),
    facts.length ? `Fixed facts from the teacher (follow them exactly):\n${facts.join('\n')}` : '',
    `Needs (most urgent first):\n${needs}`,
    `Time for learning this week: ${Math.round(req.hoursPerWeek * 60)} minutes`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Code-enforced grounding: schedule with the checks, and keep only approved source ids. */
export function finishPathway(
  req: PathwayRequest,
  reply: z.input<typeof PathwayReplySchema> | null,
): PathwayResponse {
  const input = {
    needs: req.needs,
    units: UNITS,
    hoursPerWeek: req.hoursPerWeek,
    teachingDaysPerWeek: req.teachingDaysPerWeek ?? null,
    weekStart: req.weekStart,
    yearLevels: req.yearLevels,
    focusYears: req.newToYears,
  };
  const items = buildPathway(input, reply?.items ?? []);
  const fromAi =
    !!reply &&
    items.length > 0 &&
    items.every((it) => reply.items.some((p) => p.unitId === it.unitId));
  const allowed = new Set(sourcesFor(req.yearLevels ?? [], req.state).map((s) => s.id));
  const external = (reply?.external ?? [])
    .filter((e) => allowed.has(e.sourceId) && APPROVED_SOURCES.some((s) => s.id === e.sourceId))
    .filter((e, i, all) => all.findIndex((x) => x.sourceId === e.sourceId) === i)
    .slice(0, 3)
    .map((e) => ({
      sourceId: e.sourceId,
      reason: e.reason.replace(/—/g, ', ').trim().slice(0, 200),
    }));
  return { items, external, source: fromAi ? 'ai' : 'rules' };
}

export async function handlePathway(request: Request, env: Env, deps: Deps = {}) {
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
  const parsed = PathwayRequestSchema.safeParse(body);
  if (!parsed.success) return error('invalid_input', 'We could not read your needs and hours.');
  const req = parsed.data;
  const text = req.needs.map((n) => `${n.topic}\n${n.evidence}`).join('\n');
  if (findLikelyStudentNames(text).length)
    return error(
      'invalid_input',
      "It looks like this includes a student's name. Please remove names and personal details, then try again.",
      { reason: 'student_pii' },
    );

  const wait = await checkRateLimit(subject, env, fetchImpl);
  if (wait)
    return error(
      'rate_limited',
      "You've reached this hour's limit. Please try again a little later.",
      { retryAfterSeconds: wait },
    );

  const sources = sourcesFor(req.yearLevels ?? [], req.state)
    .map((s) => `- ${s.id}: ${s.organisation}, ${s.title}. ${s.summary}`)
    .join('\n');
  const model = mainModel(env);
  const result = await generateJson(
    deps.complete ?? anthropicCompleter(env, LONG_CALL),
    {
      model,
      system: buildPrompt('pathway', { UNIT_LIST: catalogueFor(req), SOURCE_LIST: sources }),
      messages: [{ role: 'user', content: userMessage(req) }],
      maxTokens: MAX_TOKENS.pathway,
    },
    PathwayReplySchema,
  );
  await logAiCall(
    subject,
    env,
    {
      endpoint: 'pathway',
      model,
      inputTokens: result.usage.input,
      outputTokens: result.usage.output,
      ok: result.ok,
    },
    fetchImpl,
  );
  // If the AI is down or its reply is unusable, the rules version still gives a week.
  return json(finishPathway(req, result.ok ? result.data : null));
}

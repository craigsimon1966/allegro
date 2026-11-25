import { z } from 'zod';
import { MAX_PARALLELS, normaliseAnswer } from '../shared/quickCheck';

// Content checks (TECH_SPEC 10): schema, tags, misconception links, modules, 3 to 8 minutes,
// MCQ answers among the options, and no em dashes. Pure, so tests can feed it broken content.

const WrongAnswerSchema = z.object({
  answer: z.string().min(1),
  feedback: z.string().min(1),
  misconceptionId: z.string().optional(),
});

const QuestionShape = {
  id: z.string().min(1),
  stemMd: z.string().min(1),
  type: z.enum(['mcq', 'numeric', 'short']),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1),
  feedbackCorrect: z.string().min(1),
  feedbackIncorrect: z.string().min(1),
  wrongAnswers: z.array(WrongAnswerSchema).optional(),
  workedSolutionMd: z.string().min(1).optional(),
};

const ParallelSchema = z.object({ ...QuestionShape, workedSolutionMd: z.string().min(1) });

const CheckItemSchema = z
  .object({
    ...QuestionShape,
    incremental: z.boolean().optional(),
    skill: z
      .string()
      .regex(/^[a-z]+\.[a-z-]+$/)
      .optional(),
    parallels: z.array(ParallelSchema).max(MAX_PARALLELS).optional(),
  })
  .passthrough();

type Question = z.infer<typeof ParallelSchema> | z.infer<typeof CheckItemSchema>;
const norm = normaliseAnswer;

/** Problems with one question or parallel: MCQ answer and options, wrong-answer feedback. */
function questionProblems(file: string, q: Question, misIds: Set<string>): string[] {
  const out: string[] = [];
  const opts = q.options ?? [];
  if (q.type === 'mcq' && !opts.includes(q.answer))
    out.push(`${file}: check ${q.id} answer is not one of its options`);
  if (new Set(opts.map(norm)).size !== opts.length)
    out.push(`${file}: check ${q.id} has two options that read the same`);
  for (const w of q.wrongAnswers ?? []) {
    if (norm(w.answer) === norm(q.answer))
      out.push(`${file}: check ${q.id} lists its own answer as a wrong answer`);
    if (q.type === 'mcq' && !opts.includes(w.answer))
      out.push(`${file}: check ${q.id} wrong answer "${w.answer}" is not one of its options`);
    if (w.misconceptionId && !misIds.has(w.misconceptionId))
      out.push(`${file}: check ${q.id} unknown misconception ${w.misconceptionId}`);
  }
  return out;
}

const UnitSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  moduleId: z.string().min(1),
  title: z.string().min(1),
  domain: z.enum(['CK', 'PK', 'PCK', 'ASSESSMENT', 'WELLBEING', 'CONTEXT']),
  tags: z.array(z.string()).min(1),
  audience: z.array(
    z.enum([
      'out_of_field',
      'early_career',
      'casual',
      'experienced',
      'leader',
      'primary',
      'secondary',
    ]),
  ),
  yearLevels: z.array(z.string()),
  durationMinutes: z.number().int(),
  format: z.array(z.enum(['text', 'worked_example', 'video', 'reflective_task', 'interactive'])),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  curriculumRefs: z.object({ ac9: z.array(z.string()), nsw: z.array(z.string()) }),
  aitslStandards: z.array(z.string()),
  hook: z.string().min(1),
  coreIdeaMd: z.string().min(1),
  workedExampleMd: z.string().optional(),
  misconceptionIds: z.array(z.string()),
  checkItems: z.array(CheckItemSchema),
  tryTomorrow: z.string().min(1),
  reflectPrompt: z.string().min(1),
  reviewedBy: z.string().nullable(),
  reviewedOn: z.string().optional(),
  reviewedHash: z.string().optional(),
});

export interface ContentInput {
  /** Unit files keyed by file name, e.g. "lin-01-what-a-rule-tells-you.json". */
  units: Record<string, unknown>;
  tags: { id: string }[];
  misconceptions: { id: string; topicTag: string; [k: string]: unknown }[];
  modules: { id: string; unitIds: string[] }[];
  diagnostics: { id: string; topicTag: string; type: string; options?: string[]; answer: string }[];
}

const EM_DASH = /—/;

function strings(v: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof v === 'string') out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) strings(x, path ? `${path}.${k}` : k, out);
  return out;
}

export function validateContent(c: ContentInput): string[] {
  const problems: string[] = [];
  const tagIds = new Set(c.tags.map((t) => t.id));
  const misIds = new Set(c.misconceptions.map((m) => m.id));
  const modById = new Map(c.modules.map((m) => [m.id, m]));
  const unitIds = new Set<string>();

  for (const [file, raw] of Object.entries(c.units)) {
    const parsed = UnitSchema.safeParse(raw);
    if (!parsed.success) {
      for (const i of parsed.error.issues)
        problems.push(`${file}: ${i.path.join('.') || '(root)'} ${i.message}`);
      continue;
    }
    const u = parsed.data;
    if (file !== `${u.id}.json`)
      problems.push(`${file}: id "${u.id}" does not match the file name`);
    if (unitIds.has(u.id)) problems.push(`${file}: duplicate unit id ${u.id}`);
    unitIds.add(u.id);
    if (u.durationMinutes < 3 || u.durationMinutes > 8)
      problems.push(`${file}: durationMinutes ${u.durationMinutes} is outside 3 to 8`);
    for (const t of u.tags) if (!tagIds.has(t)) problems.push(`${file}: unknown tag ${t}`);
    for (const m of u.misconceptionIds)
      if (!misIds.has(m)) problems.push(`${file}: unknown misconception ${m}`);
    const mod = modById.get(u.moduleId);
    if (!mod) problems.push(`${file}: unknown module ${u.moduleId}`);
    else if (!mod.unitIds.includes(u.id))
      problems.push(`${file}: module ${u.moduleId} does not list this unit`);
    const ids = new Set<string>();
    u.checkItems.forEach((q, qi) => {
      problems.push(...questionProblems(file, q, misIds));
      const ps = q.parallels ?? [];
      if (q.incremental) {
        if (!ps.length) problems.push(`${file}: check ${q.id} is incremental but has no parallels`);
        if (!q.skill) problems.push(`${file}: check ${q.id} is incremental but has no skill`);
        if (qi === u.checkItems.length - 1)
          problems.push(`${file}: check ${q.id} is incremental but no question comes after it`);
      }
      const stems = new Set([norm(q.stemMd)]);
      for (const p of ps) {
        problems.push(...questionProblems(file, p, misIds));
        if (p.type !== q.type) problems.push(`${file}: parallel ${p.id} is not the same type`);
        if (stems.has(norm(p.stemMd)))
          problems.push(`${file}: parallel ${p.id} repeats an earlier question`);
        stems.add(norm(p.stemMd));
        // Fixed labels like True and False may repeat; a worked answer must change.
        const fixedLabel = p.type === 'mcq' && (q.options ?? []).includes(p.answer);
        if (!fixedLabel && norm(p.answer) === norm(q.answer))
          problems.push(`${file}: parallel ${p.id} has the same answer as ${q.id}`);
      }
      for (const id of [q.id, ...ps.map((p) => p.id)]) {
        if (ids.has(id)) problems.push(`${file}: duplicate check id ${id}`);
        ids.add(id);
      }
    });
    for (const [p, s] of strings(u, ''))
      if (EM_DASH.test(s)) problems.push(`${file}: em dash in ${p}`);
  }

  for (const m of c.modules)
    for (const id of m.unitIds)
      if (!unitIds.has(id)) problems.push(`modules.json: ${m.id} lists missing unit ${id}`);

  const seenMis = new Set<string>();
  for (const m of c.misconceptions) {
    if (seenMis.has(m.id)) problems.push(`misconceptions.json: duplicate id ${m.id}`);
    seenMis.add(m.id);
    if (!tagIds.has(m.topicTag))
      problems.push(`misconceptions.json: ${m.id} has unknown tag ${m.topicTag}`);
    for (const [p, s] of strings(m, ''))
      if (EM_DASH.test(s)) problems.push(`misconceptions.json: ${m.id} em dash in ${p}`);
  }

  for (const d of c.diagnostics) {
    if (!tagIds.has(d.topicTag))
      problems.push(`diagnostics.json: ${d.id} has unknown tag ${d.topicTag}`);
    if (d.type === 'mcq' && !(d.options ?? []).includes(d.answer))
      problems.push(`diagnostics.json: ${d.id} answer is not one of its options`);
  }
  return problems;
}

import { z } from 'zod';

// Content checks (TECH_SPEC 10): schema, tags, misconception links, modules, 3 to 8 minutes,
// MCQ answers among the options, and no em dashes. Pure, so tests can feed it broken content.

const CheckItemSchema = z
  .object({
    id: z.string().min(1),
    stemMd: z.string().min(1),
    type: z.enum(['mcq', 'numeric', 'short']),
    options: z.array(z.string()).optional(),
    answer: z.string().min(1),
    feedbackCorrect: z.string().min(1),
    feedbackIncorrect: z.string().min(1),
  })
  .passthrough();

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
    for (const q of u.checkItems)
      if (q.type === 'mcq' && !(q.options ?? []).includes(q.answer))
        problems.push(`${file}: check ${q.id} answer is not one of its options`);
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

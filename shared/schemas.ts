import { z } from 'zod';

// Shared Zod schemas used by the SPA and the Pages Functions (TECH_SPEC 3.1, 4).
// Diagnosis and Lesson follow SPEC 8.3 and 8.4. Request schemas are added per milestone.

export const Domain = z.enum(['CK', 'PK', 'PCK', 'ASSESSMENT', 'WELLBEING', 'CONTEXT']);
export const Role = z.enum(['out_of_field', 'early_career', 'casual', 'experienced', 'leader']);
export const Priority = z.enum(['now', 'soon', 'later']);

export const NeedSchema = z.object({
  id: z.string(),
  domain: Domain,
  topic: z.string(),
  catalogue_tags: z.array(z.string()),
  evidence: z.string(),
  priority: Priority,
});

export const DiagnosisSchema = z.object({
  summary: z.string(),
  context: z.object({
    role: Role,
    subject: z.string(),
    year_levels: z.array(z.string()),
    school_type: z.enum(['government', 'catholic', 'independent', 'unknown']),
    location_type: z.enum(['metro', 'regional', 'rural', 'remote', 'unknown']),
    timeframe_weeks: z.number().nullable(),
    hours_per_week: z.number().nullable(),
  }),
  needs: z.array(NeedSchema),
  clarifying_questions: z.array(z.string()).max(2),
  safety_flags: z.array(z.enum(['student_pii', 'wellbeing_concern', 'out_of_scope'])),
});

export const LessonBlockType = z.enum([
  'intention',
  'prerequisites',
  'vocabulary',
  'explicit_teaching',
  'misconceptions',
  'guided_practice',
  'independent_practice',
  'check_for_understanding',
  'exit_ticket',
]);

export const LessonBlockSchema = z.object({
  id: z.string(),
  type: LessonBlockType,
  title: z.string(),
  content_md: z.string(),
  rationale: z.string(),
  source: z.enum(['seeded', 'ai_draft']),
  needs_maths_check: z.boolean(),
});

export const LessonSchema = z.object({
  lesson_id: z.string(),
  title: z.string(),
  year_level: z.string(),
  duration_minutes: z.number().int().positive(),
  curriculum_refs: z.object({ ac9: z.array(z.string()), nsw: z.array(z.string()) }),
  blocks: z.array(LessonBlockSchema),
});

export const ApiErrorCode = z.enum([
  'rate_limited',
  'invalid_input',
  'ai_unavailable',
  'ai_invalid_output',
  'unauthorised',
  'server_error',
]);

export type Need = z.infer<typeof NeedSchema>;
export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonBlock = z.infer<typeof LessonBlockSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCode>;

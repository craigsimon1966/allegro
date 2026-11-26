import { z } from 'zod';
import { STATE_IDS } from './states';

// Shared Zod schemas used by the SPA and the Pages Functions (TECH_SPEC 3.1, 4).
// Diagnosis and Lesson follow SPEC 8.3 and 8.4. Request schemas are added per milestone.

export const Domain = z.enum(['CK', 'PK', 'PCK', 'ASSESSMENT', 'WELLBEING', 'CONTEXT']);
/**
 * The teacher's role. The first six are what the form offers; out_of_field, early_career and
 * experienced are older values, still read from saved profiles and the AI's reading of a
 * teacher's words (they are situations now; see normaliseGuided in shared/profile.ts).
 */
export const Role = z.enum([
  'classroom',
  'casual',
  'hod',
  'leader',
  'coach',
  'preservice',
  'out_of_field',
  'early_career',
  'experienced',
]);
/** Where the teacher is and what is new to them. Which ones are offered depends on the role. */
export const Situation = z.enum([
  // Classroom teacher
  'early_career',
  'out_of_field',
  'new_stage',
  'harder_course',
  'returning',
  'sharpen',
  // Casual or relief
  'casual_out_of_field',
  'block_placement',
  // Head of Department
  'new_to_leading',
  'supporting_staff',
  'preparing_relief',
  'curriculum_change',
  'still_teaching',
  // School leader
  'no_maths_background',
  'staffing_out_of_field',
  'building_capability',
  // Instructional coach or mentor
  'mentoring_early_career',
  'supporting_out_of_field',
  'coaching_team',
  // Pre-service
  'practicum',
  'first_role',
  'content_gaps',
  // Older value, read from saved profiles only (now casual_out_of_field)
  'casual_cover',
]);
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
  curriculum_refs: z.object({
    ac9: z.array(z.string()),
    nsw: z.array(z.string()),
    senior: z.array(z.string()).optional(),
  }),
  blocks: z.array(LessonBlockSchema),
});

/**
 * The classroom pack for a lesson: student worksheets, a step-by-step teacher guide and smart
 * board slides. Drafted by a second AI call (POST /api/lesson-pack) so the lesson reply stays
 * within its token limit. Answers live on worksheet items and slides for the teacher's answer
 * key only; worksheets and slides never print them.
 */
export const PackLevel = z.enum(['all', 'start', 'core', 'stretch']);

export const PackStepSchema = z.object({
  block_id: z.string(),
  /** What the teacher does, in order. */
  do: z.array(z.string()).max(5),
  /** Words the teacher can say. */
  say: z.array(z.string()).max(3),
  /** Questions to ask the class. */
  ask: z.array(z.string()).max(4),
  /** What to listen and look for while students work. */
  watch_for: z.array(z.string()).max(3),
});

export const PackItemSchema = z.object({
  prompt_md: z.string(),
  answer_md: z.string(),
  /** Room to work: short (2 lines), medium (5 lines), long (9 lines). */
  space: z.enum(['short', 'medium', 'long']),
});

export const PackSectionSchema = z.object({
  heading: z.string(),
  level: PackLevel,
  block_id: z.string(),
  items: z.array(PackItemSchema).max(10),
});

export const PackSlideSchema = z.object({
  kind: z.enum(['title', 'intention', 'vocabulary', 'example', 'problem', 'hinge', 'reflection']),
  block_id: z.string(),
  heading: z.string(),
  /** One idea, shown large. Never the answer or the working. */
  body_md: z.string(),
  /** Hinge question options, shown as large numbered boxes. */
  options: z.array(z.string()).max(4).default([]),
  /** Leave a blank area for the teacher to write on the board. */
  writing_space: z.boolean(),
  /** For the teacher guide's answer key only; never shown on the slide. */
  answer_md: z.string().default(''),
});

export const LessonPackSchema = z.object({
  steps: z.array(PackStepSchema).max(12),
  worksheet: z.object({
    title: z.string(),
    instructions: z.string(),
    sections: z.array(PackSectionSchema).max(8),
  }),
  exit_ticket: z.array(PackItemSchema).max(3),
  slides: z.array(PackSlideSchema).min(1).max(18),
  /** Parts built from the lesson text because the AI could not draft them. */
  plain: z.array(z.enum(['guide', 'slides'])).optional(),
});

/** The two AI replies that make a pack: steps and worksheets, and slides. */
export const PackGuidePartSchema = LessonPackSchema.pick({
  steps: true,
  worksheet: true,
  exit_ticket: true,
});
export const PackSlidesPartSchema = LessonPackSchema.pick({ slides: true });

export const ApiErrorCode = z.enum([
  'rate_limited',
  'invalid_input',
  'ai_unavailable',
  'ai_invalid_output',
  'unauthorised',
  'server_error',
]);

export const GuidedSchema = z.object({
  /** State or territory, for the right curriculum (shared/states.ts). */
  state: z.enum(STATE_IDS).optional(),
  role: Role.optional(),
  subject: z.string().max(100).optional(),
  yearLevels: z.array(z.string().max(10)).max(13).optional(),
  schoolType: z.enum(['government', 'catholic', 'independent', 'unknown']).optional(),
  locationType: z.enum(['metro', 'regional', 'rural', 'remote', 'unknown']).optional(),
  weeks: z.number().int().min(1).max(52).nullable().optional(),
  hoursPerWeek: z.number().min(0.5).max(5).optional(),
  /** How many days a week they teach, 1 to 5. Learning goes on the other days. */
  teachingDaysPerWeek: z.number().int().min(1).max(5).optional(),
  /** Old profiles only: the weekdays they taught (1 = Monday). Read as a count; see daysPerWeek. */
  teachingDays: z.array(z.number().int().min(1).max(5)).max(5).optional(),
  /** Their situation, any that apply. */
  situations: z.array(Situation).max(12).optional(),
  /** Year levels they are confident teaching, and year levels that are new to them. */
  confidentYears: z.array(z.string().max(10)).max(13).optional(),
  newToYears: z.array(z.string().max(10)).max(13).optional(),
});

export const DiagnoseRequestSchema = z.object({
  situationText: z.string().trim().min(1).max(4000),
  guided: GuidedSchema.optional(),
  clarifyingAnswers: z.array(z.string().max(1000)).max(2).optional(),
});

export const AccessRequestSchema = z.object({ code: z.string().min(1).max(200) });

export type Guided = z.infer<typeof GuidedSchema>;
export type DiagnoseRequest = z.infer<typeof DiagnoseRequestSchema>;
export type Need = z.infer<typeof NeedSchema>;
export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonBlock = z.infer<typeof LessonBlockSchema>;
export type LessonPack = z.infer<typeof LessonPackSchema>;
export type PackItem = z.infer<typeof PackItemSchema>;
export type PackSlide = z.infer<typeof PackSlideSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCode>;

// The teacher's own facts (year levels, state, role, location), taken from what they told us.
// What the teacher chose in the guided fields always wins over what the AI inferred from their
// words, and these facts are passed to every AI call as fixed constraints.
import type { Diagnosis, Guided } from './schemas';
import { yearLabel } from './curriculum';

export type RoleId = NonNullable<Guided['role']>;
export type SituationId = NonNullable<Guided['situations']>[number];

/** The roles the form offers, in order. */
export const ROLES: { id: RoleId; label: string }[] = [
  { id: 'classroom', label: 'Classroom teacher' },
  { id: 'casual', label: 'Casual or relief teacher' },
  { id: 'hod', label: 'Head of Department' },
  { id: 'leader', label: 'School leader' },
  { id: 'coach', label: 'Instructional coach or mentor' },
  { id: 'preservice', label: 'Pre-service teacher' },
];

/** How each role is described to the model, so it pitches explanations to the teacher. */
export const ROLE_PROMPT: Record<RoleId, string> = {
  classroom: 'a classroom teacher.',
  casual:
    'a casual or relief teacher who may not know the class. Keep it simple to pick up and run with little preparation.',
  hod: 'a Head of Department for maths, who leads a team and may also teach. Include how to brief and support other teachers, not only how to teach the class.',
  leader:
    'a school leader responsible for maths, who may not have a maths background. Frame advice so they can support and staff other teachers.',
  coach:
    'an instructional coach or mentor supporting other teachers. Frame advice so it can be modelled, observed and shared.',
  preservice:
    'a pre-service teacher, still training. Explain plainly and include classroom basics as well as the maths.',
  out_of_field:
    'teaching maths outside their trained subject. Explain the maths itself plainly, assume no maths teaching background, and avoid jargon.',
  early_career:
    'an early career teacher. Give clear routines and practical classroom steps as well as the maths.',
  experienced:
    'experienced in teaching maths. Skip the basics and focus on sharper moves and common errors.',
};

/** Short role names for the "Built for" line. */
export const ROLE_SHORT: Record<RoleId, string> = {
  classroom: 'classroom teacher',
  casual: 'casual or relief',
  hod: 'Head of Department',
  leader: 'school leader',
  coach: 'coach or mentor',
  preservice: 'pre-service teacher',
  out_of_field: 'teaching out of field',
  early_career: 'early career',
  experienced: 'experienced in maths',
};

/**
 * The situation ticks for each role, in order. Some ids appear under more than one role.
 * A Head of Department who ticks "Still teaching my own classes" also sees the classroom ticks.
 */
const CLASSROOM: { id: SituationId; label: string; hint?: string }[] = [
  { id: 'early_career', label: 'In my first few years of teaching' },
  { id: 'out_of_field', label: 'Teaching maths outside my specialist area' },
  {
    id: 'new_stage',
    label: 'Confident in maths, new to this year level or stage',
    hint: 'For example, confident in Stage 1 but new to Stage 3',
  },
  {
    id: 'harder_course',
    label: 'Moving up to a harder course',
    hint: 'For example, from Standard to Extension in Year 12',
  },
  { id: 'returning', label: 'Returning to teaching after a break' },
  { id: 'sharpen', label: 'Experienced and confident, looking to sharpen my practice' },
];

export const SITUATIONS_BY_ROLE: Record<
  'classroom' | 'casual' | 'hod' | 'leader' | 'coach' | 'preservice',
  { id: SituationId; label: string; hint?: string }[]
> = {
  classroom: CLASSROOM,
  casual: [
    { id: 'casual_out_of_field', label: 'Covering maths classes outside my specialist area' },
    { id: 'block_placement', label: 'Starting a longer-term or block relief placement' },
    { id: 'returning', label: 'Returning to teaching after a break' },
    { id: 'early_career', label: 'Early career' },
  ],
  hod: [
    { id: 'new_to_leading', label: 'New to leading a maths team' },
    { id: 'supporting_staff', label: 'Supporting out-of-field or early-career staff' },
    { id: 'preparing_relief', label: 'Preparing lessons or cover for relief teachers' },
    { id: 'curriculum_change', label: 'Leading a curriculum or syllabus change' },
    { id: 'still_teaching', label: 'Still teaching my own classes' },
  ],
  leader: [
    { id: 'no_maths_background', label: 'Overseeing maths without a maths background' },
    { id: 'staffing_out_of_field', label: 'Staffing maths classes with out-of-field teachers' },
    { id: 'building_capability', label: 'Building maths teaching capability across the school' },
    { id: 'preparing_relief', label: 'Preparing cover for relief teachers' },
  ],
  coach: [
    { id: 'mentoring_early_career', label: 'Mentoring an early-career teacher' },
    { id: 'supporting_out_of_field', label: 'Supporting an out-of-field maths teacher' },
    { id: 'coaching_team', label: 'Coaching across a team or school' },
  ],
  preservice: [
    { id: 'practicum', label: 'On a practicum placement' },
    { id: 'first_role', label: 'About to start my first teaching role' },
    { id: 'content_gaps', label: 'Not confident in some maths content' },
  ],
};

/** The ticks shown for a role and what is already ticked. No role yet: the classroom ticks. */
export function situationsFor(
  role: RoleId | undefined | null,
  ticked: SituationId[] = [],
): { id: SituationId; label: string; hint?: string }[] {
  const key =
    role && role in SITUATIONS_BY_ROLE ? (role as keyof typeof SITUATIONS_BY_ROLE) : 'classroom';
  const own = SITUATIONS_BY_ROLE[key];
  if (key === 'hod' && ticked.includes('still_teaching'))
    return [...own, ...CLASSROOM.filter((c) => !own.some((o) => o.id === c.id))];
  return own;
}

/** Situations that ask which years the teacher is confident in and which are new. */
export const ASKS_LEVELS: SituationId[] = [
  'new_stage',
  'harder_course',
  'casual_out_of_field',
  'block_placement',
];

/** Every label a situation has, for turning ticks into words. */
export function situationLabel(id: SituationId, role?: RoleId | null): string {
  const mine = situationsFor(role, [id, 'still_teaching']).find((s) => s.id === id);
  if (mine) return mine.label;
  for (const list of Object.values(SITUATIONS_BY_ROLE)) {
    const found = list.find((s) => s.id === id);
    if (found) return found.label;
  }
  return SITUATION_PROMPT[id];
}

/** How each situation is described to the model. */
export const SITUATION_PROMPT: Record<SituationId, string> = {
  early_career:
    'in their first few years of teaching: give clear routines and practical classroom steps',
  out_of_field:
    'teaching maths outside their specialist area: explain the maths itself plainly, but do not explain general teaching basics',
  new_stage:
    'confident with maths but new to this year level or stage: focus on what is different at this level (content, pace, how students think), not on maths they already know',
  harder_course:
    'moving up to a harder course than they have taught before: focus on the harder content and the common errors in it',
  returning:
    'returning to teaching after a break: point out what has changed in the curriculum and current practice',
  sharpen:
    'experienced and confident in maths, looking to sharpen their practice: skip the basics, focus on sharper moves, research-backed refinements and common errors',
  casual_out_of_field:
    'a casual or relief teacher covering maths outside their specialist area: explain the maths plainly and keep things quick to pick up with little preparation',
  block_placement:
    'starting a longer-term or block relief placement: help them plan a sequence over several weeks, not only single lessons',
  new_to_leading: 'new to leading a maths team: include how to lead, brief and support colleagues',
  supporting_staff:
    'supporting out-of-field or early-career staff: frame advice so they can pass it on and check it is working',
  preparing_relief:
    'preparing lessons or cover for relief teachers: make plans self-explanatory for someone who may not know maths or the class',
  curriculum_change:
    'leading a curriculum or syllabus change: link advice to the curriculum and how to bring a team along',
  still_teaching: 'still teaching their own classes as well as leading',
  no_maths_background:
    'overseeing maths without a maths background: explain the maths and what good maths teaching looks like plainly',
  staffing_out_of_field:
    'staffing maths classes with out-of-field teachers: focus on what those teachers need and how to support them',
  building_capability:
    'building maths teaching capability across the school: think in terms of whole-staff routines and professional learning',
  mentoring_early_career:
    'mentoring an early-career teacher: give advice they can model, observe and give feedback on',
  supporting_out_of_field:
    'supporting an out-of-field maths teacher: focus on the maths content and misconceptions that teacher will meet',
  coaching_team: 'coaching across a team or school: give shared routines and observation focuses',
  practicum:
    'a pre-service teacher on a practicum placement: practical classroom steps and lessons they can teach under supervision',
  first_role:
    'about to start their first teaching role: routines, planning and the maths for the years they will teach',
  content_gaps:
    'not confident in some maths content: explain the maths itself step by step before how to teach it',
  casual_cover:
    'a casual or relief teacher covering maths: keep things quick to pick up with little preparation',
};

/** Old role values become a role plus a situation. */
const LEGACY_ROLE: Partial<Record<RoleId, { role: RoleId; situation?: SituationId }>> = {
  out_of_field: { role: 'classroom', situation: 'out_of_field' },
  early_career: { role: 'classroom', situation: 'early_career' },
  experienced: { role: 'classroom', situation: 'sharpen' },
};

/** Days a week they teach. Old profiles stored the weekdays, so count those. */
export function daysPerWeek(g: Guided | null | undefined): number | null {
  if (g?.teachingDaysPerWeek) return g.teachingDaysPerWeek;
  return g?.teachingDays?.length ? g.teachingDays.length : null;
}

/**
 * Brings an old profile up to date: weekdays become a count, old roles become a role and a
 * situation, and the old casual situation takes its new name.
 */
export function normaliseGuided(g: Guided): Guided {
  let out = g;
  if (out.teachingDays) {
    const { teachingDays, ...rest } = out;
    out =
      rest.teachingDaysPerWeek || !teachingDays.length
        ? rest
        : { ...rest, teachingDaysPerWeek: teachingDays.length };
  }
  const legacy = out.role ? LEGACY_ROLE[out.role] : undefined;
  if (legacy) {
    const sits = out.situations ?? [];
    out = {
      ...out,
      role: legacy.role,
      situations:
        legacy.situation && !sits.includes(legacy.situation) ? [legacy.situation, ...sits] : sits,
    };
  }
  if (out.situations?.includes('casual_cover'))
    out = {
      ...out,
      situations: [
        ...new Set(out.situations.map((s) => (s === 'casual_cover' ? 'casual_out_of_field' : s))),
      ],
    };
  return out;
}

/** The role phrase for the "Built for" line: the situation says more than the role when it fits. */
export function roleShort(p: { role: RoleId | null; situations: SituationId[] }): string | null {
  if (p.situations.includes('out_of_field') || p.situations.includes('casual_out_of_field'))
    return 'teaching out of field';
  if (p.situations.includes('early_career') && (!p.role || p.role === 'classroom'))
    return 'early career';
  return p.role ? ROLE_SHORT[p.role] : null;
}

export interface TeacherProfile {
  years: string[];
  state: Guided['state'] | null;
  role: RoleId | null;
  locationType: Guided['locationType'] | null;
  situations: SituationId[];
  confidentYears: string[];
  newToYears: string[];
  daysPerWeek: number | null;
}

/**
 * The teacher's situation as fixed facts for a prompt, one line each. Shared by every AI call
 * so the diagnosis, the week and lessons all read the teacher the same way.
 */
export function situationFacts(p: {
  situations?: SituationId[];
  confidentYears?: string[];
  newToYears?: string[];
  daysPerWeek?: number | null;
}): string[] {
  const years = (ys: string[]) => ys.map(yearLabel).join(', ');
  return [
    ...(p.situations ?? []).map((s) => `- Their situation: ${SITUATION_PROMPT[s]}.`),
    p.confidentYears?.length
      ? `- Confident teaching: ${years(p.confidentYears)}. Do not explain basics they already know at these levels.`
      : '',
    p.newToYears?.length
      ? `- New to teaching: ${years(p.newToYears)}. Put needs, units and explanations for these levels first.`
      : '',
    p.daysPerWeek
      ? `- They teach ${p.daysPerWeek} day${p.daysPerWeek === 1 ? '' : 's'} a week.${p.daysPerWeek < 5 ? ' Learning goes on their other days.' : ''}`
      : '',
  ].filter(Boolean);
}

export function teacherProfile(
  guided: Guided | null | undefined,
  diagnosis: Diagnosis | null | undefined,
): TeacherProfile {
  const ctx = diagnosis?.context;
  guided = guided ? normaliseGuided(guided) : guided;
  const ctxLocation = ctx?.location_type;
  return {
    years: guided?.yearLevels?.length ? guided.yearLevels : (ctx?.year_levels ?? []),
    state: guided?.state ?? null,
    role: guided?.role ?? ctx?.role ?? null,
    locationType:
      guided?.locationType ??
      (ctxLocation && ctxLocation !== 'unknown' ? (ctxLocation as Guided['locationType']) : null),
    situations: guided?.situations ?? [],
    confidentYears: guided?.confidentYears ?? [],
    newToYears: guided?.newToYears ?? [],
    daysPerWeek: daysPerWeek(guided),
  };
}

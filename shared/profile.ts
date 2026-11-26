// The teacher's own facts (year levels, state, role, location), taken from what they told us.
// What the teacher chose in the guided fields always wins over what the AI inferred from their
// words, and these facts are passed to every AI call as fixed constraints.
import type { Diagnosis, Guided } from './schemas';
import { yearLabel } from './curriculum';

type RoleId = NonNullable<Guided['role']>;

/** How each role is described to the model, so it pitches explanations to the teacher. */
export const ROLE_PROMPT: Record<RoleId, string> = {
  out_of_field:
    'teaching maths outside their trained subject. Explain the maths itself plainly, assume no maths teaching background, and avoid jargon.',
  early_career:
    'an early career teacher. Give clear routines and practical classroom steps as well as the maths.',
  casual:
    'a casual or relief teacher who may not know the class. Keep it simple to pick up and run with little preparation.',
  experienced:
    'experienced in teaching maths. Skip the basics and focus on sharper moves and common errors.',
  leader: 'a school leader supporting other teachers.',
};

/** Short role names for the "Built for" line. */
export const ROLE_SHORT: Record<RoleId, string> = {
  out_of_field: 'teaching out of field',
  early_career: 'early career',
  casual: 'casual or relief',
  experienced: 'experienced in maths',
  leader: 'school leader',
};

export type SituationId = NonNullable<Guided['situations']>[number];

/** The situation options on "Tell us about you", in the order shown. */
export const SITUATIONS: { id: SituationId; label: string; hint?: string }[] = [
  { id: 'early_career', label: 'In my first few years of teaching' },
  { id: 'out_of_field', label: 'Experienced teacher, new to teaching maths' },
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
  { id: 'casual_cover', label: 'Casual or relief, covering maths classes' },
];

/** How each situation is described to the model. */
export const SITUATION_PROMPT: Record<SituationId, string> = {
  early_career:
    'in their first few years of teaching: give clear routines and practical classroom steps',
  out_of_field:
    'an experienced teacher who is new to teaching maths: explain the maths itself plainly, but do not explain general teaching basics',
  new_stage:
    'confident with maths but new to this year level or stage: focus on what is different at this level (content, pace, how students think), not on maths they already know',
  harder_course:
    'moving up to a harder course than they have taught before: focus on the harder content and the common errors in it',
  returning:
    'returning to teaching after a break: point out what has changed in the curriculum and current practice',
  casual_cover:
    'a casual or relief teacher covering maths: keep things quick to pick up with little preparation',
};

/** Which role a situation implies, for teachers who chose a situation but no role. */
const ROLE_FROM_SITUATION: Partial<Record<SituationId, RoleId>> = {
  out_of_field: 'out_of_field',
  early_career: 'early_career',
  casual_cover: 'casual',
  new_stage: 'experienced',
  harder_course: 'experienced',
};

/** Days a week they teach. Old profiles stored the weekdays, so count those. */
export function daysPerWeek(g: Guided | null | undefined): number | null {
  if (g?.teachingDaysPerWeek) return g.teachingDaysPerWeek;
  return g?.teachingDays?.length ? g.teachingDays.length : null;
}

/** Brings an old profile up to date: weekdays become a count. */
export function normaliseGuided(g: Guided): Guided {
  if (!g.teachingDays) return g;
  const { teachingDays, ...rest } = g;
  return rest.teachingDaysPerWeek || !teachingDays.length
    ? rest
    : { ...rest, teachingDaysPerWeek: teachingDays.length };
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
  const ctxLocation = ctx?.location_type;
  return {
    years: guided?.yearLevels?.length ? guided.yearLevels : (ctx?.year_levels ?? []),
    state: guided?.state ?? null,
    role:
      guided?.role ??
      (guided?.situations ?? []).map((x) => ROLE_FROM_SITUATION[x]).find(Boolean) ??
      ctx?.role ??
      null,
    locationType:
      guided?.locationType ??
      (ctxLocation && ctxLocation !== 'unknown' ? (ctxLocation as Guided['locationType']) : null),
    situations: guided?.situations ?? [],
    confidentYears: guided?.confidentYears ?? [],
    newToYears: guided?.newToYears ?? [],
    daysPerWeek: daysPerWeek(guided),
  };
}

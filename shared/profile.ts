// The teacher's own facts (year levels, state, role, location), taken from what they told us.
// What the teacher chose in the guided fields always wins over what the AI inferred from their
// words, and these facts are passed to every AI call as fixed constraints.
import type { Diagnosis, Guided } from './schemas';

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

export interface TeacherProfile {
  years: string[];
  state: Guided['state'] | null;
  role: RoleId | null;
  locationType: Guided['locationType'] | null;
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
    role: guided?.role ?? ctx?.role ?? null,
    locationType:
      guided?.locationType ??
      (ctxLocation && ctxLocation !== 'unknown' ? (ctxLocation as Guided['locationType']) : null),
  };
}

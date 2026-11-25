// The official maths curriculum lists, and the checks every code passes before a teacher sees it.
// content/curriculum/*.json come from ACARA and NESA via scripts/curriculum-import.ts, never by hand.
// A code is shown only when it is in the official list AND it belongs to the teacher's year
// (or, for NSW outcomes, the stage that covers that year). Anything else, including -TODO
// placeholders and codes a model might make up, is dropped.
import ac9File from '../content/curriculum/ac9-maths.json';
import nswFile from '../content/curriculum/nsw-maths.json';
import { TAGS, tagById } from './tags';
import { stateById } from './states';

export interface Ac9Code {
  code: string;
  year: string;
  strand: string;
  text: string;
}
export interface NswOutcome {
  code: string;
  stage: string;
  years: string[];
  text: string;
}

/** A checked code, ready to show: the code, where it sits, and its official wording. */
export interface CheckedCode {
  code: string;
  /** "Year 8" for AC v9, "Stage 4" for NSW. */
  level: string;
  text: string;
}

export interface CurriculumRefs {
  ac9: string[];
  nsw: string[];
}

export const AC9: Ac9Code[] = ac9File;
export const NSW: NswOutcome[] = nswFile;
const AC9_BY_CODE = new Map(AC9.map((c) => [c.code, c]));
const NSW_BY_CODE = new Map(NSW.map((c) => [c.code, c]));

export const YEAR_LEVELS = ['F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;

export const yearLabel = (year: string) => (year === 'F' ? 'Foundation' : `Year ${year}`);

/** The NSW stage that covers a school year, e.g. "8" is Stage 4. */
export function nswStageFor(year: string): string | null {
  const o = NSW.find((n) => n.years.includes(year));
  return o ? o.stage : null;
}

/** Years in the same NSW stage, e.g. "8" gives ["7", "8"]. */
export function stageYears(year: string): string[] {
  return NSW.find((n) => n.years.includes(year))?.years ?? [year];
}

const fitsYears = (codeYears: string[], years: string[] | null) =>
  !years || years.length === 0 || codeYears.some((y) => years.includes(y));

/** An AC v9 code, checked against the official list and (when given) the teacher's years. */
export function checkAc9(code: string, years: string[] | null): CheckedCode | null {
  const c = AC9_BY_CODE.get(code);
  if (!c || !fitsYears([c.year], years)) return null;
  return { code: c.code, level: yearLabel(c.year), text: c.text };
}

/** A NSW outcome, checked against the NESA list and the stage that covers the teacher's years. */
export function checkNsw(code: string, years: string[] | null): CheckedCode | null {
  const c = NSW_BY_CODE.get(code);
  if (!c || !fitsYears(c.years, years)) return null;
  return { code: c.code, level: c.stage, text: c.text };
}

/** Keeps only the codes that pass both checks, in order, without repeats. */
export function checkRefs(
  refs: CurriculumRefs,
  years: string[] | null,
): { ac9: CheckedCode[]; nsw: CheckedCode[] } {
  const keep = (codes: string[], check: typeof checkAc9) => {
    const seen = new Set<string>();
    return codes.flatMap((c) => {
      const r = seen.has(c) ? null : check(c, years);
      seen.add(c);
      return r ? [r] : [];
    });
  };
  return { ac9: keep(refs.ac9, checkAc9), nsw: keep(refs.nsw, checkNsw) };
}

/**
 * The curriculum rows to show. AC v9 for every state (it is what every state's maths builds on);
 * the NSW syllabus row too for NSW teachers. Victoria and WA see AC v9 only until their own codes
 * are looked up, so no placeholder ever reaches the screen. Rows with nothing valid are left out.
 */
export function curriculumRows(
  refs: CurriculumRefs,
  state: string | null | undefined,
  years: string[] | null,
): { label: string; codes: CheckedCode[] }[] {
  const checked = checkRefs(refs, years);
  const rows = [{ label: 'AC v9', codes: checked.ac9 }];
  // With no state chosen, NSW, as before (the demo teachers are all in NSW).
  if ((stateById(state)?.id ?? 'NSW') === 'NSW')
    rows.push({ label: 'NSW syllabus', codes: checked.nsw });
  return rows.filter((r) => r.codes.length > 0);
}

/** Does this topic belong in this year? Topics with no year list (teaching practice) fit any year. */
export function topicFitsYear(tagId: string, year: string): boolean {
  const t = tagById(tagId);
  if (!t) return false;
  return t.yearLevels.length === 0 || t.yearLevels.includes(year);
}

/**
 * Lesson topics for a year: maths topics (CK) and topic-specific teaching (PCK) that are tied to
 * the years they are taught in (content/tags.json, checked against AC v9).
 */
export function lessonTopicsFor(year: string) {
  return TAGS.filter(
    (t) =>
      (t.domain === 'CK' || t.domain === 'PCK') &&
      t.yearLevels.length > 0 &&
      topicFitsYear(t.id, year) &&
      // A lesson topic is maths content with official codes. A general teaching approach
      // (such as differentiation) is learnt in the week, not planned as a lesson topic.
      topicRefs(t.id).ac9.length > 0,
  );
}

/** A topic's codes (content/tags.json), for lessons. Checking against the year happens on display. */
export function topicRefs(tagId: string): CurriculumRefs {
  const c = (tagById(tagId) as { curriculum?: CurriculumRefs } | undefined)?.curriculum;
  return { ac9: c?.ac9 ?? [], nsw: c?.nsw ?? [] };
}

/** "Year 8, NSW Stage 4" or "Year 8, Queensland": the line that says who a plan was built for. */
export function builtForLine(opts: {
  years: string[];
  state?: string | null;
  role?: string | null;
}): string {
  const parts: string[] = [];
  const ys = [...new Set(opts.years)].sort(
    (a, b) => YEAR_LEVELS.indexOf(a as never) - YEAR_LEVELS.indexOf(b as never),
  );
  if (ys.length)
    parts.push(
      ys.length === 1
        ? yearLabel(ys[0]!)
        : `Years ${ys.join(', ')}`.replace('Years F', 'Foundation'),
    );
  const s = stateById(opts.state);
  if (s?.id === 'NSW' && ys.length) {
    const stages = [...new Set(ys.map(nswStageFor).filter(Boolean))];
    if (stages.length) parts.push(`NSW ${stages.join(' and ')}`);
  } else if (s) parts.push(s.name);
  if (opts.role) parts.push(opts.role);
  return parts.join(', ');
}

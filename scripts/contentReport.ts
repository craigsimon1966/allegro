import { createHash } from 'node:crypto';
import type { MicroUnit } from '../shared/types';

// Content report and pilot gate (TECH_SPEC 10.3). Pure, so it can be unit tested.

/** Hash of a unit's content, ignoring the review fields. Store it as reviewedHash on approval. */
export function unitHash(unit: MicroUnit): string {
  const content: Partial<MicroUnit> = { ...unit };
  delete content.reviewedBy;
  delete content.reviewedOn;
  delete content.reviewedHash;
  return createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
}

const isTodo = (code: string) => /-TODO$/.test(code);

export interface ContentReport {
  total: number;
  unreviewed: string[];
  changedSinceReview: string[];
  todoCodes: { id: string; ac9: number; nsw: number }[];
}

export function contentReport(units: MicroUnit[]): ContentReport {
  const unreviewed: string[] = [];
  const changedSinceReview: string[] = [];
  const todoCodes: ContentReport['todoCodes'] = [];
  for (const u of units) {
    if (!u.reviewedBy) unreviewed.push(u.id);
    else if (u.reviewedHash !== unitHash(u)) changedSinceReview.push(u.id);
    const ac9 = u.curriculumRefs.ac9.filter(isTodo).length;
    const nsw = u.curriculumRefs.nsw.filter(isTodo).length;
    if (ac9 || nsw) todoCodes.push({ id: u.id, ac9, nsw });
  }
  return { total: units.length, unreviewed, changedSinceReview, todoCodes };
}

export const gatePasses = (r: ContentReport) =>
  !r.unreviewed.length && !r.changedSinceReview.length && !r.todoCodes.length;

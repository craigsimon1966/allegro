// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contentReport, gatePasses, unitHash } from '../../scripts/contentReport';
import { UNITS } from '../../shared/catalogue';
import type { MicroUnit } from '../../shared/types';

describe('content report and pilot gate', () => {
  it('flags every drafted unit as unreviewed, so the gate does not pass yet', () => {
    const r = contentReport(UNITS);
    expect(r.unreviewed.length).toBe(UNITS.length);
    expect(gatePasses(r)).toBe(false);
  });
  it('passes a reviewed unit with real codes, and catches edits after review', () => {
    const base = structuredClone(UNITS[0]!) as MicroUnit;
    base.curriculumRefs = { ac9: ['TEST-CODE-A'], nsw: ['TEST-CODE-B'] };
    const reviewed = { ...base, reviewedBy: 'Reviewer', reviewedHash: unitHash(base) };
    expect(gatePasses(contentReport([reviewed]))).toBe(true);
    const edited = { ...reviewed, hook: reviewed.hook + ' Edited.' };
    expect(contentReport([edited]).changedSinceReview).toEqual([edited.id]);
  });
});

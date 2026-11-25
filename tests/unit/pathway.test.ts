import { describe, expect, it } from 'vitest';
import { UNITS, MISCONCEPTIONS, unitById } from '@shared/catalogue';
import { buildPathway, sydneyWeekStart, totalMinutes } from '@shared/pathway';
import { personaById, PERSONAS } from '@shared/personas';
import { TAG_IDS } from '@shared/tags';

const tammy = personaById('tammy')!;
const needsOf = (id: string) => personaById(id)!.cachedDiagnosis.needs;

describe('content catalogue', () => {
  it('every unit is a draft with placeholder curriculum codes and known tags', () => {
    expect(UNITS.length).toBeGreaterThanOrEqual(20);
    for (const u of UNITS) {
      expect(u.reviewedBy).toBeNull();
      for (const t of u.tags) expect(TAG_IDS.has(t)).toBe(true);
      for (const c of [...u.curriculumRefs.ac9, ...u.curriculumRefs.nsw])
        expect(c).toMatch(/^(AC9|NSW)-TODO$/);
      for (const m of u.misconceptionIds) expect(MISCONCEPTIONS.some((x) => x.id === m)).toBe(true);
      expect(u.checkItems.length).toBeGreaterThanOrEqual(1);
      for (const c of u.checkItems) if (c.type === 'mcq') expect(c.options).toContain(c.answer);
      expect(u.durationMinutes).toBeGreaterThanOrEqual(4);
      expect(u.durationMinutes).toBeLessThanOrEqual(7);
    }
  });

  it('has no em dashes or US spellings', () => {
    const text = JSON.stringify([UNITS, MISCONCEPTIONS]);
    expect(text).not.toMatch(/—/);
    expect(text).not.toMatch(/\b(math|color|organiz\w*|personaliz\w*)\b/i);
  });

  it('every tag has at least one unit, so no need leaves an empty week', () => {
    for (const t of TAG_IDS) expect(UNITS.some((u) => u.tags.includes(t))).toBe(true);
  });
});

describe('buildPathway', () => {
  const base = {
    units: UNITS,
    weekStart: '2026-11-23',
  };

  it('never exceeds the time budget', () => {
    for (const hours of [0.5, 1, 2]) {
      const items = buildPathway({
        ...base,
        needs: needsOf('tammy'),
        hoursPerWeek: hours,
        teachingDays: [1, 3, 4],
      });
      expect(totalMinutes(items, UNITS)).toBeLessThanOrEqual(hours * 60);
      expect(items.length).toBeGreaterThan(0);
    }
  });

  it('puts learning on non-teaching days only when there are some', () => {
    const items = buildPathway({
      ...base,
      needs: needsOf('tammy'),
      hoursPerWeek: tammy.guided.hoursPerWeek!,
      teachingDays: tammy.guided.teachingDays!,
    });
    // Tammy teaches Mon, Wed, Thu, so learning lands on Tue 24 and Fri 27.
    for (const it of items) expect(['2026-11-24', '2026-11-27']).toContain(it.scheduledFor);
    const all = buildPathway({
      ...base,
      needs: needsOf('sam'),
      hoursPerWeek: 1.5,
      teachingDays: [1, 2, 3, 4, 5],
    });
    expect(all.length).toBeGreaterThan(0);
  });

  it('starts with the most urgent needs and covers each "now" need early', () => {
    const items = buildPathway({
      ...base,
      needs: needsOf('tammy'),
      hoursPerWeek: 2,
      teachingDays: [1, 3, 4],
    });
    const firstThree = items.slice(0, 3).map((i) => i.needId);
    expect(new Set(firstThree)).toEqual(new Set(['tammy-1', 'tammy-2', 'tammy-3']));
    expect(new Set(items.map((i) => i.unitId)).size).toBe(items.length);
    expect(unitById(items[0]!.unitId)?.tags).toContain('algebra.linear');
  });

  it('builds a week for every persona', () => {
    for (const p of PERSONAS) {
      const items = buildPathway({
        ...base,
        needs: p.cachedDiagnosis.needs,
        hoursPerWeek: p.guided.hoursPerWeek ?? 2,
        teachingDays: p.guided.teachingDays ?? [],
      });
      expect(items.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('sydneyWeekStart', () => {
  it('returns the Sydney Monday', () => {
    // Sunday 29 Nov 2026 at 15:00 UTC is Monday 30 Nov in Sydney.
    expect(sydneyWeekStart(new Date('2026-11-29T15:00:00Z'))).toBe('2026-11-30');
    expect(sydneyWeekStart(new Date('2026-11-25T08:00:00Z'))).toBe('2026-11-23');
  });
});

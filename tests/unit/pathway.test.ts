import { describe, expect, it } from 'vitest';
import { UNITS, MISCONCEPTIONS, unitById } from '@shared/catalogue';
import {
  buildPathway,
  effectivePriority,
  orderNeeds,
  learningDays,
  sydneyWeekStart,
  totalMinutes,
  unitFitsYears,
} from '@shared/pathway';
import { personaById, PERSONAS } from '@shared/personas';
import { TAG_IDS } from '@shared/tags';
import { checkRefs } from '@shared/curriculum';

const tammy = personaById('tammy')!;
const needsOf = (id: string) => personaById(id)!.cachedDiagnosis.needs;

describe('content catalogue', () => {
  it('every unit is a draft with known tags and only official codes for its own years', () => {
    expect(UNITS.length).toBeGreaterThanOrEqual(20);
    for (const u of UNITS) {
      expect(u.reviewedBy).toBeNull();
      for (const t of u.tags) expect(TAG_IDS.has(t)).toBe(true);
      const checked = checkRefs(u.curriculumRefs, u.yearLevels);
      expect(checked.ac9.map((c) => c.code)).toEqual(u.curriculumRefs.ac9);
      expect(checked.nsw.map((c) => c.code)).toEqual(u.curriculumRefs.nsw);
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
        teachingDaysPerWeek: 3,
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
      teachingDaysPerWeek: tammy.guided.teachingDaysPerWeek!,
    });
    // Tammy teaches 3 days a week, so learning is spread over 2 days: Tue 24 and Fri 27.
    for (const it of items) expect(['2026-11-24', '2026-11-27']).toContain(it.scheduledFor);
    const all = buildPathway({
      ...base,
      needs: needsOf('sam'),
      hoursPerWeek: 1.5,
      teachingDaysPerWeek: 5,
    });
    expect(all.length).toBeGreaterThan(0);
  });

  it('starts with the most urgent needs and covers each "now" need early', () => {
    const items = buildPathway({
      ...base,
      needs: needsOf('tammy'),
      hoursPerWeek: 2,
      teachingDaysPerWeek: 3,
    });
    const firstThree = items.slice(0, 3).map((i) => i.needId);
    expect(new Set(firstThree)).toEqual(new Set(['tammy-1', 'tammy-2', 'tammy-3']));
    expect(new Set(items.map((i) => i.unitId)).size).toBe(items.length);
    expect(unitById(items[0]!.unitId)?.tags).toContain('algebra.linear');
  });

  it('keeps every demo teacher week the same with their own year levels (no ratings yet)', () => {
    for (const p of PERSONAS) {
      const input = {
        ...base,
        needs: p.cachedDiagnosis.needs,
        hoursPerWeek: p.guided.hoursPerWeek ?? 2,
        teachingDaysPerWeek: p.guided.teachingDaysPerWeek ?? null,
      };
      expect(buildPathway({ ...input, yearLevels: p.guided.yearLevels })).toEqual(
        buildPathway(input),
      );
    }
  });

  it('never schedules a unit for another year', () => {
    const items = buildPathway({
      ...base,
      needs: [
        {
          id: 'n1',
          topic: 'Ratio',
          evidence: '',
          priority: 'now',
          catalogue_tags: ['number.proportional', 'algebra.linear', 'primary.early-number'],
        },
      ],
      hoursPerWeek: 5,
      teachingDaysPerWeek: null,
      yearLevels: ['9'],
    });
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) expect(unitFitsYears(unitById(it.unitId)!, ['9'])).toBe(true);
    expect(items.some((it) => it.unitId.startsWith('prop-'))).toBe(false);
    expect(items.some((it) => it.unitId.startsWith('pri-'))).toBe(false);
  });

  it('puts the biggest concerns first in the week', () => {
    const needs = [
      {
        id: 'a',
        topic: 'A',
        evidence: '',
        priority: 'now' as const,
        catalogue_tags: ['pk.routines'],
        concern: 2,
      },
      {
        id: 'b',
        topic: 'B',
        evidence: '',
        priority: 'soon' as const,
        catalogue_tags: ['algebra.linear'],
        concern: 5,
      },
      {
        id: 'c',
        topic: 'C',
        evidence: '',
        priority: 'now' as const,
        catalogue_tags: ['pk.explicit-instruction'],
        concern: 4,
      },
    ];
    expect(effectivePriority(needs[1]!)).toBe('now');
    expect(orderNeeds(needs).map((n) => n.id)).toEqual(['b', 'c', 'a']);
    const items = buildPathway({ ...base, needs, hoursPerWeek: 2, teachingDaysPerWeek: null });
    expect(items[0]!.needId).toBe('b');
    // The AI's order gives way to the teacher's ratings too.
    const ai = buildPathway({ ...base, needs, hoursPerWeek: 2, teachingDaysPerWeek: null }, [
      { unitId: 'pk-routines-01-entry', needId: 'a', reason: 'r' },
      { unitId: 'lin-01-what-a-rule-tells-you', needId: 'b', reason: 'r' },
    ]);
    expect(ai.map((i) => i.needId)).toEqual(['b', 'a']);
  });

  it('builds a week for every persona', () => {
    for (const p of PERSONAS) {
      const items = buildPathway({
        ...base,
        needs: p.cachedDiagnosis.needs,
        hoursPerWeek: p.guided.hoursPerWeek ?? 2,
        teachingDaysPerWeek: p.guided.teachingDaysPerWeek ?? null,
      });
      expect(items.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('days a week', () => {
  const base = { units: UNITS, weekStart: '2026-11-23' };
  it('spreads learning over the days off, or the whole week', () => {
    expect(learningDays(3)).toEqual([2, 5]);
    expect(learningDays(4)).toEqual([5]);
    expect(learningDays(1)).toEqual([1, 2, 4, 5]);
    expect(learningDays(5)).toEqual([1, 2, 3, 4, 5]);
    expect(learningDays(null)).toEqual([1, 2, 3, 4, 5]);
  });

  it('puts units for years new to the teacher first', () => {
    const needs = [
      {
        id: 'n',
        topic: 'Algebra misconceptions',
        evidence: '',
        priority: 'now' as const,
        catalogue_tags: ['pck.algebra-misconceptions'],
      },
    ];
    const input = { ...base, needs, hoursPerWeek: 5, teachingDaysPerWeek: null };
    expect(buildPathway({ ...input, focusYears: ['9'] })[0]!.unitId).toBe('mc-01-goes-up-by');
    expect(buildPathway({ ...input, focusYears: ['7'] })[0]!.unitId).toBe('mc-02-pronumerals');
  });
});

describe('sydneyWeekStart', () => {
  it('returns the Sydney Monday', () => {
    // Sunday 29 Nov 2026 at 15:00 UTC is Monday 30 Nov in Sydney.
    expect(sydneyWeekStart(new Date('2026-11-29T15:00:00Z'))).toBe('2026-11-30');
    expect(sydneyWeekStart(new Date('2026-11-25T08:00:00Z'))).toBe('2026-11-23');
  });
});

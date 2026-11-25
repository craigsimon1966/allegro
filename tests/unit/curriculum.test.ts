import { describe, expect, it } from 'vitest';
import {
  AC9,
  NSW,
  YEAR_LEVELS,
  builtForLine,
  checkAc9,
  checkNsw,
  curriculumRows,
  lessonTopicsFor,
  nswStageFor,
  topicFitsYear,
  topicRefs,
} from '@shared/curriculum';
import { curriculumRefsFor } from '@shared/lesson';
import { TAGS } from '@shared/tags';

describe('official curriculum lists', () => {
  it('has every AC v9 maths year, with codes that name their own year', () => {
    expect(AC9.length).toBeGreaterThanOrEqual(230);
    for (const y of YEAR_LEVELS) expect(AC9.some((c) => c.year === y)).toBe(true);
    for (const c of AC9) {
      expect(c.code.startsWith(`AC9M${c.year}`)).toBe(true);
      expect(c.text.length).toBeGreaterThan(10);
      expect(c.text).not.toMatch(/\\|<|TODO/);
    }
  });

  it('has the NSW outcomes, each tied to the stage in its code', () => {
    expect(NSW.length).toBeGreaterThanOrEqual(120);
    const prefix: Record<string, string> = {
      MAE: 'Early Stage 1',
      MA1: 'Stage 1',
      MA2: 'Stage 2',
      MA3: 'Stage 3',
      MA4: 'Stage 4',
      MA5: 'Stage 5',
    };
    for (const o of NSW) {
      expect(o.stage).toBe(prefix[o.code.slice(0, 3)]);
      expect(o.text.length).toBeGreaterThan(10);
    }
    expect(nswStageFor('8')).toBe('Stage 4');
    expect(nswStageFor('9')).toBe('Stage 5');
  });
});

describe('checking a code before it is shown', () => {
  it('rejects placeholders, made-up codes and codes from another year', () => {
    expect(checkAc9('AC9-TODO', null)).toBeNull();
    expect(checkAc9('AC9M8A99', null)).toBeNull();
    expect(checkAc9('AC9M8A02', ['9'])).toBeNull();
    expect(checkAc9('AC9M8A02', ['8'])?.text).toMatch(/^graph linear relations/);
    expect(checkNsw('NSW-TODO', null)).toBeNull();
    expect(checkNsw('MA5-LIN-C-01', ['8'])).toBeNull();
    expect(checkNsw('MA4-LIN-C-01', ['7'])?.level).toBe('Stage 4');
  });

  it('shows AC v9 everywhere, NSW only for NSW, and never a placeholder', () => {
    const refs = { ac9: ['AC9M8A02', 'AC9-TODO', 'AC9M9A03'], nsw: ['MA4-LIN-C-01', 'NSW-TODO'] };
    const nsw = curriculumRows(refs, 'NSW', ['8']);
    expect(nsw.map((r) => r.label)).toEqual(['AC v9', 'NSW syllabus']);
    expect(nsw[0]!.codes.map((c) => c.code)).toEqual(['AC9M8A02']);
    expect(nsw[1]!.codes.map((c) => c.code)).toEqual(['MA4-LIN-C-01']);
    for (const s of ['VIC', 'WA', 'QLD', 'SA', 'TAS', 'ACT', 'NT']) {
      const rows = curriculumRows(refs, s, ['8']);
      expect(rows.map((r) => r.label)).toEqual(['AC v9']);
      expect(JSON.stringify(rows)).not.toContain('TODO');
    }
  });

  it('leaves out a row when nothing in it passes', () => {
    expect(curriculumRows({ ac9: ['AC9-TODO'], nsw: ['NSW-TODO'] }, 'NSW', ['8'])).toEqual([]);
  });
});

describe('topics and the years they are taught in', () => {
  it('every topic code is official and belongs to one of the topic years', () => {
    for (const t of TAGS) {
      const refs = topicRefs(t.id);
      for (const c of refs.ac9) expect(checkAc9(c, t.yearLevels), `${t.id} ${c}`).not.toBeNull();
      for (const c of refs.nsw) expect(checkNsw(c, t.yearLevels), `${t.id} ${c}`).not.toBeNull();
    }
  });

  it('offers a lesson topic in a year only when AC v9 has content for it in that year', () => {
    for (const y of YEAR_LEVELS)
      for (const t of lessonTopicsFor(y)) {
        const refs = curriculumRefsFor(t.id, y);
        expect(refs.ac9.length, `${t.id} offered in Year ${y} with no AC v9 code`).toBeGreaterThan(
          0,
        );
        for (const c of refs.ac9) expect(c.startsWith(`AC9M${y}`)).toBe(true);
      }
  });

  it('filters lesson topics by year', () => {
    const ids = (y: string) => lessonTopicsFor(y).map((t) => t.id);
    expect(ids('8')).toEqual(
      expect.arrayContaining(['algebra.linear', 'algebra.foundations', 'number.proportional']),
    );
    expect(ids('8')).not.toContain('primary.early-number');
    expect(ids('1')).toEqual(['primary.early-number']);
    expect(ids('9')).not.toContain('number.proportional');
    expect(ids('4')).toEqual([]);
    expect(topicFitsYear('pk.routines', '4')).toBe(true);
  });
});

describe('the "Built for" line', () => {
  it('names the year, the NSW stage and the role', () => {
    expect(builtForLine({ years: ['8'], state: 'NSW', role: 'teaching out of field' })).toBe(
      'Year 8, NSW Stage 4, teaching out of field',
    );
    expect(builtForLine({ years: ['9', '7'], state: 'QLD' })).toBe('Years 7, 9, Queensland');
    expect(builtForLine({ years: ['F'], state: 'NSW' })).toBe('Foundation, NSW Early Stage 1');
    expect(builtForLine({ years: [] })).toBe('');
  });
});

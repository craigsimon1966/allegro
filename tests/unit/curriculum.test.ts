import { describe, expect, it } from 'vitest';
import {
  AC9,
  NSW,
  SENIOR,
  SENIOR_YEARS,
  YEAR_LEVELS,
  builtForLine,
  checkAc9,
  checkNsw,
  checkSenior,
  curriculumRows,
  lessonTopicsFor,
  nswStageFor,
  seniorCourseFor,
  topicFitsYear,
  topicRefs,
} from '@shared/curriculum';
import { curriculumRefsFor } from '@shared/lesson';
import { NEED_TAGS, TAGS, filterTags } from '@shared/tags';
import { UNITS } from '@shared/catalogue';

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
      MST: 'Stage 6',
    };
    for (const o of NSW) {
      expect(o.stage).toBe(prefix[o.code.slice(0, 3)]);
      expect(o.text.length).toBeGreaterThan(10);
    }
    expect(nswStageFor('8')).toBe('Stage 4');
    expect(nswStageFor('9')).toBe('Stage 5');
    expect(nswStageFor('11')).toBe('Stage 6');
    // Mathematics Standard 11-12: each outcome is for Year 11 or Year 12, never both.
    const standard = NSW.filter((o) => o.code.startsWith('MST-'));
    expect(standard.length).toBe(25);
    for (const o of standard) expect(o.years).toEqual([o.code.startsWith('MST-11') ? '11' : '12']);
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
    expect(ids('1')).toContain('primary.early-number');
    expect(ids('1')).not.toContain('algebra.linear');
    expect(ids('9')).not.toContain('number.proportional');
    expect(ids('4')).toContain('number.fractions');
    expect(ids('10')).toContain('algebra.linear');
    expect(topicFitsYear('pk.routines', '4')).toBe(true);
  });

  it('offers at least 5 maths topics in every year from Foundation to Year 10', () => {
    for (const y of YEAR_LEVELS) {
      const maths = lessonTopicsFor(y).filter((t) => t.domain === 'CK');
      expect(maths.length, `Year ${y}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('offers NSW Mathematics Standard topics in Years 11 and 12, for NSW teachers only', () => {
    for (const y of SENIOR_YEARS) {
      const nsw = lessonTopicsFor(y, 'NSW');
      expect(nsw.length, `Year ${y}`).toBeGreaterThanOrEqual(5);
      // Every senior topic carries an official Stage 6 outcome for that year.
      for (const t of nsw)
        expect(
          topicRefs(t.id).nsw.some((c) => checkNsw(c, [y])),
          t.id,
        ).toBe(true);
      expect(lessonTopicsFor(y).map((t) => t.id)).toEqual(nsw.map((t) => t.id));
      expect(lessonTopicsFor(y, 'VIC')).toEqual([]);
      expect(seniorCourseFor('VIC')).toBeNull();
    }
    expect(seniorCourseFor('NSW')).toBe('NSW Mathematics Standard');
    // Senior topics never appear in Years F to 10.
    for (const y of YEAR_LEVELS)
      expect(lessonTopicsFor(y, 'NSW').some((t) => t.id.startsWith('senior.'))).toBe(false);
    expect(curriculumRefsFor('senior.networks', '12').nsw).toEqual([
      'MST-12-S2-06',
      'MST-12-S2-07',
    ]);
  });

  it('offers SACE topics in SA and the NT, and TASC topics in Tasmania, from their official documents', () => {
    expect(SENIOR.filter((o) => o.course.startsWith('SACE')).length).toBeGreaterThanOrEqual(25);
    expect(SENIOR.filter((o) => o.course.startsWith('TASC')).length).toBe(16);
    for (const o of SENIOR) expect(o.text).not.toMatch(/<|TODO/);
    for (const state of ['SA', 'NT', 'TAS', 'QLD', 'WA', 'ACT'])
      for (const y of SENIOR_YEARS) {
        const topics = lessonTopicsFor(y, state);
        expect(topics.length, `${state} Year ${y}`).toBeGreaterThanOrEqual(4);
        for (const t of topics)
          expect(
            (topicRefs(t.id).senior ?? []).some((c) => checkSenior(c, [y], state)),
            `${state} ${t.id}`,
          ).toBe(true);
      }
    expect(seniorCourseFor('SA')).toBe('SACE General Mathematics');
    expect(seniorCourseFor('TAS')).toBe('TASC General Mathematics');
    expect(seniorCourseFor('QLD')).toBe('QCAA General Mathematics');
    expect(seniorCourseFor('WA')).toBe('SCSA Mathematics Applications ATAR');
    expect(seniorCourseFor('ACT')).toBe('BSSS Mathematical Applications');
    // Queensland, WA and the ACT come from the uploaded syllabuses: every unit, 3 to 5 topics each.
    for (const [prefix, n] of [
      ['QCAA', 20],
      ['BSSS', 12],
      ['SCSA', 12],
    ] as const)
      expect(SENIOR.filter((o) => o.code.startsWith(prefix)).length, prefix).toBe(n);
    expect(checkSenior('QCAA Unit 4 Topic 1', ['12'], 'QLD')?.text).toBe(
      'Loans, investments and annuities 1',
    );
    expect(checkSenior('SCSA Topic 3.3', ['12'], 'ACT')).toBeNull();
    // A Tasmanian code never shows for a South Australian teacher, and Stage 2 never in Year 11.
    expect(checkSenior('MTG315123 Outcome 7', ['12'], 'SA')).toBeNull();
    expect(checkSenior('Stage 2 Subtopic 4.1', ['11'], 'SA')).toBeNull();
    const rows = curriculumRows(curriculumRefsFor('senior.financial', '12'), 'TAS', ['12']);
    expect(rows.map((r) => r.label)).toEqual(['TASC General Mathematics']);
    expect(rows[0]!.codes.map((c) => c.code)).toEqual(['MTG315123 Outcome 7']);
  });

  it('marks a topic lesson-only exactly when no learning unit uses it', () => {
    for (const t of TAGS) {
      const hasUnit = UNITS.some((u) => u.tags.includes(t.id));
      expect(Boolean(t.lessonOnly), `${t.id}: set lessonOnly to ${!hasUnit}`).toBe(!hasUnit);
    }
  });

  it('keeps lesson-only topics out of needs', () => {
    const lessonOnly = TAGS.filter((t) => t.lessonOnly).map((t) => t.id);
    expect(NEED_TAGS.some((t) => t.lessonOnly)).toBe(false);
    expect(filterTags([...lessonOnly, 'algebra.linear'])).toEqual(['algebra.linear']);
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

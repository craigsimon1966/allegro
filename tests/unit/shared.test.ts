import { describe, expect, it } from 'vitest';
import { findLikelyStudentNames } from '@shared/pii';
import { fallbackDiagnosis } from '@shared/fallbackDiagnosis';
import {
  DIAGNOSTICS,
  calibrationMessage,
  isCorrect,
  itemsForTag,
  resultFor,
} from '@shared/diagnostics';
import { PERSONAS, personaById } from '@shared/personas';
import { DiagnosisSchema } from '@shared/schemas';
import { TAG_IDS, filterTags } from '@shared/tags';
import {
  ROLES,
  SITUATION_PROMPT,
  daysPerWeek,
  normaliseGuided,
  roleShort,
  situationFacts,
  situationsFor,
  teacherProfile,
  type SituationId,
} from '@shared/profile';

describe('student name detection', () => {
  it('flags a full name next to a word about students', () => {
    expect(findLikelyStudentNames('One student, Jack Smith, keeps calling out.')).toEqual([
      'Jack Smith',
    ]);
  });
  it('ignores names when nothing suggests a student', () => {
    expect(findLikelyStudentNames('I met Jack Smith at the conference.')).toEqual([]);
  });
  it('does not flag ordinary capitalised phrases', () => {
    expect(
      findLikelyStudentNames('My Year 8 students start Linear Relationships next week.'),
    ).toEqual([]);
  });
});

describe('fallback diagnosis', () => {
  it('returns a valid diagnosis with 3 to 6 needs and at most 3 "now"', () => {
    const d = fallbackDiagnosis(
      'PE teacher now teaching Year 8 maths, linear relationships next week',
      {
        role: 'out_of_field',
        yearLevels: ['8'],
      },
    );
    expect(DiagnosisSchema.safeParse(d).success).toBe(true);
    expect(d.needs.length).toBeGreaterThanOrEqual(3);
    expect(d.needs.length).toBeLessThanOrEqual(6);
    expect(d.needs.filter((n) => n.priority === 'now').length).toBeLessThanOrEqual(3);
    for (const n of d.needs) expect(filterTags(n.catalogue_tags)).toEqual(n.catalogue_tags);
  });
  it('still works with almost nothing to go on', () => {
    const d = fallbackDiagnosis('help');
    expect(DiagnosisSchema.safeParse(d).success).toBe(true);
    expect(d.needs.length).toBeGreaterThanOrEqual(3);
  });
});

describe('diagnostics', () => {
  it('every item uses a real tag, is unreviewed, and MCQ answers are one of the options', () => {
    for (const item of DIAGNOSTICS) {
      expect(TAG_IDS.has(item.topicTag), item.id).toBe(true);
      expect(item.reviewedBy, item.id).toBeNull();
      if (item.type === 'mcq') expect(item.options, item.id).toContain(item.answer);
    }
  });
  it('has 4 items for each CK topic with a check', () => {
    for (const tag of new Set(DIAGNOSTICS.map((d) => d.topicTag)))
      expect(itemsForTag(tag)).toHaveLength(4);
  });
  it('accepts numeric answers with dollar signs and trailing zeros', () => {
    const item = {
      id: 'x',
      stemMd: '',
      type: 'numeric' as const,
      answer: '1.5',
      feedbackCorrect: '',
      feedbackIncorrect: '',
    };
    expect(isCorrect(item, '$1.50')).toBe(true);
    expect(isCorrect(item, '1.5')).toBe(true);
    expect(isCorrect(item, '15')).toBe(false);
    expect(isCorrect(item, '')).toBe(false);
  });
  it('maps results without a score', () => {
    expect(resultFor(4, 4)).toBe('solid');
    expect(resultFor(2, 4)).toBe('refresh');
    expect(resultFor(1, 4)).toBe('start_here');
  });
  it('gives an honest message when the self-rating and check disagree', () => {
    expect(calibrationMessage(1, 'refresh', 'Linear relationships')).toMatch(/worth a refresh/);
    expect(calibrationMessage(5, 'solid', 'Linear relationships')).toMatch(
      /know more than you think/,
    );
    expect(calibrationMessage(null, 'start_here', 'Linear relationships')).not.toMatch(/of 5/);
  });
  it('never uses em dashes in item text', () => {
    expect(JSON.stringify(DIAGNOSTICS)).not.toContain('—');
  });
});

describe('personas', () => {
  it('has Tammy, Sam and Priya with valid cached diagnoses', () => {
    expect(PERSONAS.map((p) => p.id)).toEqual(['tammy', 'sam', 'priya']);
    for (const p of PERSONAS) {
      expect(DiagnosisSchema.safeParse(p.cachedDiagnosis).success).toBe(true);
      for (const n of p.cachedDiagnosis.needs)
        expect(filterTags(n.catalogue_tags)).toEqual(n.catalogue_tags);
    }
    expect(personaById('tammy')?.guided.teachingDaysPerWeek).toBe(3);
  });
});

describe('teacher facts are fixed', () => {
  it('the rules fallback never suggests a topic from another year', () => {
    const d = fallbackDiagnosis('linear graphs and ratio, I am new', { yearLevels: ['2'] });
    const tags = d.needs.flatMap((n) => n.catalogue_tags);
    expect(tags).not.toContain('algebra.linear');
    expect(tags).not.toContain('number.proportional');
    expect(d.context.year_levels).toEqual(['2']);
  });
});

describe('teacher situation and days a week', () => {
  it('counts the weekdays in an old profile', () => {
    expect(normaliseGuided({ teachingDays: [1, 3, 4] })).toEqual({ teachingDaysPerWeek: 3 });
    expect(normaliseGuided({ teachingDaysPerWeek: 2 })).toEqual({ teachingDaysPerWeek: 2 });
    expect(daysPerWeek({ teachingDays: [1, 2] })).toBe(2);
    expect(daysPerWeek({})).toBeNull();
  });

  it('turns situations into fixed facts and a role', () => {
    const facts = situationFacts({
      situations: ['new_stage'],
      confidentYears: ['1', '2'],
      newToYears: ['5', '6'],
      daysPerWeek: 3,
    }).join('\n');
    expect(facts).toMatch(/new to this year level or stage/);
    expect(facts).toMatch(/Confident teaching: Year 1, Year 2/);
    expect(facts).toMatch(/New to teaching: Year 5, Year 6/);
    expect(facts).toMatch(/teach 3 days a week/);
    expect(facts).not.toMatch(/—/);
    // Old roles become a role and a situation; the old casual tick takes its new name.
    expect(teacherProfile({ role: 'out_of_field' }, null)).toMatchObject({
      role: 'classroom',
      situations: ['out_of_field'],
    });
    expect(normaliseGuided({ role: 'casual', situations: ['casual_cover'] })).toEqual({
      role: 'casual',
      situations: ['casual_out_of_field'],
    });
    expect(roleShort(teacherProfile({ role: 'out_of_field' }, null))).toBe('teaching out of field');
    expect(roleShort(teacherProfile({ role: 'hod' }, null))).toBe('Head of Department');
  });

  it('offers the situation ticks for the role, with no overlap with the roles', () => {
    const ids = (role: Parameters<typeof situationsFor>[0], t: SituationId[] = []) =>
      situationsFor(role, t).map((x) => x.id);
    expect(ids(undefined)).toEqual(ids('classroom'));
    expect(ids('classroom')).toContain('sharpen');
    expect(ids('hod')).not.toContain('new_stage');
    // A Head of Department who still teaches also sees the classroom ticks.
    expect(ids('hod', ['still_teaching'])).toEqual(expect.arrayContaining(ids('classroom')));
    expect(ids('preservice')).toEqual(['practicum', 'first_role', 'content_gaps']);
    for (const r of ROLES) {
      expect(r.label).not.toMatch(/—/);
      for (const x of situationsFor(r.id, ['still_teaching'])) {
        expect(SITUATION_PROMPT[x.id]).toBeTruthy();
        expect(x.label).not.toMatch(/—|\bmath\b|organiz/);
      }
    }
  });
});

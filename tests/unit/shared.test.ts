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
    expect(calibrationMessage(5, 'refresh', 'Linear relationships')).toMatch(/worth a refresh/);
    expect(calibrationMessage(1, 'solid', 'Linear relationships')).toMatch(
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
    expect(personaById('tammy')?.guided.teachingDays).toEqual([1, 3, 4]);
  });
});

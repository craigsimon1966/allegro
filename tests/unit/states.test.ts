import { describe, expect, it } from 'vitest';
import { STATES, curriculumContext, curriculumRows, stateById } from '@shared/states';
import { sourcesFor } from '@shared/sources';
import { GuidedSchema } from '@shared/schemas';
import personas from '../../content/personas.json';

const refs = { ac9: ['AC9-TODO'], nsw: ['NSW-TODO'] };

describe('states and territories', () => {
  it('lists all eight, with no em dashes in the copy', () => {
    expect(STATES.map((s) => s.id).sort()).toEqual(
      ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'].sort(),
    );
    for (const s of STATES) expect(JSON.stringify(s)).not.toContain('—');
  });

  it('shows NSW codes for NSW, and when no state is known (the old default)', () => {
    expect(curriculumRows(refs, 'NSW').map((r) => r.label)).toEqual(['AC v9', 'NSW syllabus']);
    expect(curriculumRows(refs, undefined).map((r) => r.codes)).toEqual([['AC9-TODO'], ['NSW-TODO']]);
  });

  it('gives Victoria and WA their own placeholder, never an invented code', () => {
    expect(curriculumRows(refs, 'VIC')).toEqual([
      { label: 'AC v9', codes: ['AC9-TODO'] },
      { label: 'Victorian Curriculum 2.0', codes: ['VC2-TODO'] },
    ]);
    expect(curriculumRows(refs, 'WA')[1]).toEqual({ label: 'WA Curriculum', codes: ['WA-TODO'] });
  });

  it('shows only AC v9 for states that use it directly', () => {
    for (const id of ['QLD', 'SA', 'TAS', 'ACT', 'NT'])
      expect(curriculumRows(refs, id).map((r) => r.label)).toEqual(['AC v9']);
  });

  it('tells the AI the curriculum, and never asks for codes', () => {
    expect(curriculumContext('VIC')).toContain('Victorian Curriculum');
    expect(curriculumContext('VIC')).toContain('Never give curriculum codes');
    expect(curriculumContext(undefined)).toBe('');
    expect(stateById('XX')).toBeUndefined();
  });

  it('accepts a state on the guided answers and rejects anything else', () => {
    expect(GuidedSchema.safeParse({ hoursPerWeek: 2, state: 'QLD' }).success).toBe(true);
    expect(GuidedSchema.safeParse({ hoursPerWeek: 2, state: 'Queensland' }).success).toBe(false);
  });

  it('keeps the demo personas in NSW', () => {
    const list = (personas as { personas?: unknown[] }).personas ?? (personas as unknown as unknown[]);
    for (const p of list as { guided: { state?: string } }[]) expect(p.guided.state).toBe('NSW');
  });
});

describe('further reading by state', () => {
  const ids = (state?: string) => sourcesFor(['8'], state).map((s) => s.id);

  it('shows the NSW-only links to NSW teachers and when no state is known', () => {
    expect(ids('NSW')).toEqual(expect.arrayContaining(['nesa-maths-k10', 'nsw-doe-7-10']));
    expect(ids()).toEqual(expect.arrayContaining(['nesa-maths-k10', 'nsw-doe-7-10']));
  });

  it('hides them elsewhere but keeps the national ones', () => {
    expect(ids('VIC')).not.toContain('nesa-maths-k10');
    expect(ids('VIC')).not.toContain('nsw-doe-7-10');
    expect(ids('VIC')).toContain('acara-v9-maths');
  });
});

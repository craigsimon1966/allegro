import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyEdits,
  contentHash,
  diffEdits,
  editableFields,
  editProblems,
  effectiveStatus,
  matchesFilter,
  progressOf,
  reviewItems,
  type ReviewRow,
} from '@shared/review';
import { BASE_UNITS, UNITS, unitById } from '@shared/catalogue';
import { applyReviewOverlay } from '@/lib/contentReview';
import { takeNext, rememberNext } from '@/lib/nextPath';

const unitItem = () =>
  reviewItems().find((i) => i.kind === 'unit' && i.id === 'lin-02-table-to-rule')!;

const row = (over: Partial<ReviewRow>): ReviewRow => ({
  item_kind: 'unit',
  item_id: 'lin-02-table-to-rule',
  status: 'draft',
  edits: {},
  approved_hash: null,
  reviewed_by_name: null,
  reviewed_at: null,
  version: 1,
  updated_at: '2026-11-30T00:00:00Z',
  ...over,
});

describe('review items', () => {
  it('lists every unit, misconception, check question and topic with codes once', () => {
    const items = reviewItems();
    const keys = items.map((i) => `${i.kind}:${i.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(items.filter((i) => i.kind === 'unit')).toHaveLength(BASE_UNITS.length);
    expect(items.some((i) => i.kind === 'topic' && i.id.startsWith('senior.'))).toBe(true);
    expect(items.some((i) => i.kind === 'misconception')).toBe(true);
    expect(items.some((i) => i.kind === 'diagnostic')).toBe(true);
  });

  it('never offers curriculum codes or review fields as free-text edits', () => {
    for (const item of reviewItems()) {
      for (const f of editableFields(item)) {
        expect(f.path).not.toMatch(/curriculum|reviewed/i);
      }
    }
    expect(editableFields(reviewItems().find((i) => i.kind === 'topic')!)).toEqual([]);
  });
});

describe('edits', () => {
  it('applies edits without changing the original, and ignores unknown paths', () => {
    const item = unitItem();
    const base = item.base as { hook: string; checkItems: { stemMd: string }[] };
    const out = applyEdits(base, {
      hook: 'New hook',
      'checkItems.0.stemMd': 'New stem',
      'nope.field': 'x',
      'checkItems.0.options': 'not an array',
    });
    expect(out.hook).toBe('New hook');
    expect(out.checkItems[0]!.stemMd).toBe('New stem');
    expect(base.hook).not.toBe('New hook');
    expect('nope' in out).toBe(false);
    expect(Array.isArray((out.checkItems[0] as unknown as { options: unknown }).options)).toBe(
      true,
    );
  });

  it('keeps only fields that differ from the file', () => {
    const item = unitItem();
    const base = item.base as { hook: string; title: string };
    expect(diffEdits(base, { hook: base.hook, title: 'Changed' })).toEqual({ title: 'Changed' });
  });

  it('catches an MCQ answer that is not one of the options', () => {
    const item = unitItem();
    expect(editProblems(item, { 'checkItems.0.answer': 'y = 9x' })[0]).toMatch(/match one of/);
    expect(editProblems(item, {})).toEqual([]);
    expect(editProblems(item, { title: ' ' })).toContain('The title cannot be empty.');
  });
});

describe('status and hash', () => {
  it('hash ignores key order and review fields, but not content', () => {
    expect(contentHash({ a: 1, b: [1, 2] })).toBe(contentHash({ b: [1, 2], a: 1 }));
    expect(contentHash({ a: 1, reviewedBy: 'X' })).toBe(contentHash({ a: 1, reviewedBy: null }));
    expect(contentHash({ a: 1 })).not.toBe(contentHash({ a: 2 }));
  });

  it('an approval only counts while the content matches what was approved', () => {
    const item = unitItem();
    const edits = { hook: 'Edited hook' };
    const hash = contentHash(applyEdits(item.base, edits));
    expect(effectiveStatus(item, undefined)).toBe('draft');
    expect(effectiveStatus(item, row({ status: 'approved', edits, approved_hash: hash }))).toBe(
      'approved',
    );
    expect(effectiveStatus(item, row({ status: 'approved', approved_hash: hash }))).toBe('changed');
    expect(effectiveStatus(item, row({ status: 'flagged' }))).toBe('flagged');
  });

  it('filters by year (items with no years fit all), state, kind and status', () => {
    const items = reviewItems();
    const f = { kinds: [], years: ['8'], state: null, status: 'all' as const };
    const y8 = items.filter((i) => matchesFilter(i, 'draft', f));
    expect(y8.some((i) => i.id === 'lin-02-table-to-rule')).toBe(true);
    expect(y8.some((i) => i.id === 'pri-data-01')).toBe(false);
    expect(y8.some((i) => i.yearLevels.length === 0)).toBe(true);
    const senior = items.find((i) => i.id === 'senior.networks')!;
    expect(matchesFilter(senior, 'draft', { ...f, years: [], state: 'VIC' })).toBe(false);
    expect(matchesFilter(senior, 'draft', { ...f, years: [], state: 'NSW' })).toBe(true);
    expect(matchesFilter(senior, 'approved', { ...f, years: [], status: 'todo' })).toBe(false);
    expect(matchesFilter(senior, 'changed', { ...f, years: [], status: 'todo' })).toBe(true);
    expect(progressOf(['approved', 'flagged', 'draft', 'changed'])).toEqual({
      total: 4,
      approved: 1,
      flagged: 1,
      todo: 2,
    });
  });
});

describe('overlay in the app', () => {
  beforeEach(() => applyReviewOverlay([]));

  it('shows reviewer edits and drops the Draft label once approved', () => {
    const item = unitItem();
    const edits = { hook: 'Edited hook' };
    applyReviewOverlay([row({ edits })]);
    expect(unitById(item.id)!.hook).toBe('Edited hook');
    expect(unitById(item.id)!.reviewedBy).toBeNull();

    const hash = contentHash(applyEdits(item.base, edits));
    applyReviewOverlay([
      row({
        edits,
        status: 'approved',
        approved_hash: hash,
        reviewed_by_name: 'Denise Halliday',
        reviewed_at: '2026-11-30T01:00:00Z',
      }),
    ]);
    expect(unitById(item.id)!.reviewedBy).toBe('Denise Halliday');
    expect(unitById(item.id)!.reviewedOn).toBe('2026-11-30');

    applyReviewOverlay([]);
    expect(unitById(item.id)).toBe(BASE_UNITS.find((u) => u.id === item.id));
    expect(UNITS).toHaveLength(BASE_UNITS.length);
  });

  it('keeps the Draft label when the approval is for different content', () => {
    applyReviewOverlay([row({ status: 'approved', approved_hash: '0000', reviewed_by_name: 'X' })]);
    expect(unitById('lin-02-table-to-rule')!.reviewedBy).toBeNull();
  });
});

describe('after sign-in', () => {
  it('returns to review pages only', () => {
    rememberNext('/review/unit/lin-02-table-to-rule');
    expect(takeNext()).toBe('/review/unit/lin-02-table-to-rule');
    expect(takeNext()).toBeNull();
    rememberNext('https://example.com');
    expect(takeNext()).toBeNull();
    rememberNext('//evil.example/review');
    expect(takeNext()).toBeNull();
  });
});

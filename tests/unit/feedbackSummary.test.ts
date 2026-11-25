import { describe, expect, it } from 'vitest';
import {
  csvCell,
  surveyAverages,
  thumbsByTarget,
  toCsv,
  type FeedbackRow,
} from '@/features/admin/feedbackSummary';

const row = (p: Partial<FeedbackRow>): FeedbackRow => ({
  id: 1,
  session_id: 's1',
  target: 'lesson',
  thumbs: null,
  scores: null,
  comment: null,
  created_at: '2026-11-25T00:00:00Z',
  ...p,
});

describe('admin feedback summary', () => {
  it('counts thumbs per target', () => {
    const t = thumbsByTarget([
      row({ thumbs: 1 }),
      row({ thumbs: -1 }),
      row({ thumbs: 1, target: 'help' }),
      row({ target: 'survey' }),
    ]);
    expect(t).toEqual([
      { target: 'lesson', up: 1, down: 1 },
      { target: 'help', up: 1, down: 0 },
    ]);
  });
  it('averages survey answers and ignores missing ones', () => {
    const a = surveyAverages(
      [row({ scores: { q1: 4, q2: 2 } }), row({ scores: { q1: 5 } }), row({})],
      ['q1', 'q2', 'q3'],
    );
    expect(a).toEqual([
      { key: 'q1', n: 2, mean: 4.5 },
      { key: 'q2', n: 1, mean: 2 },
      { key: 'q3', n: 0, mean: null },
    ]);
  });
  it('escapes CSV cells and blocks spreadsheet formulas', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a, "b"')).toBe('"a, ""b"""');
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell(null)).toBe('');
    const csv = toCsv([row({ thumbs: 1, comment: 'line1\nline2' })], ['q1']);
    expect(csv.split('\r\n')[0]).toBe('created_at,session_id,target,thumbs,q1,comment');
    expect(csv).toContain('"line1\nline2"');
  });
});

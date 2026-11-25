import { describe, expect, it } from 'vitest';
import { errorSummary } from '@/lib/errorReport';

describe('error reports', () => {
  it('keeps the message, page, build and the top of the stack, within 2000 characters', () => {
    const stack = [
      'TypeError: boom',
      ...Array.from({ length: 20 }, (_, i) => `at f${i} (x.js:1)`),
    ].join('\n');
    const s = errorSummary('TypeError: boom', stack, '/plan/demo-1', 'abc1234');
    expect(s.split('\n')).toEqual([
      'TypeError: boom',
      'Page: /plan/demo-1',
      'Build: abc1234',
      'at f0 (x.js:1)',
      'at f1 (x.js:1)',
      'at f2 (x.js:1)',
      'at f3 (x.js:1)',
      'at f4 (x.js:1)',
    ]);
    expect(errorSummary('x'.repeat(5000), 'y'.repeat(5000), '/', 'b').length).toBeLessThanOrEqual(
      2000,
    );
  });
});

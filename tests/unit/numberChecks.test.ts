import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkNumbers, checkRepeats, lessonNumberIssues } from '@shared/numberChecks';

const codes = (md: string) => checkNumbers(md).map((i) => i.code);

describe('checkNumbers', () => {
  it('flags two letters with the same value', () => {
    expect(codes('Check: put $x = 1$ and $y = 1$ in both.')).toContain('same_value_letters');
    expect(codes('Put $x = 2$ and $y = 3$ in both.')).toEqual([]);
  });

  it('does not treat a rule as a value', () => {
    expect(codes('When $x = 2$, $y = 2x + 5$ gives 9.')).toEqual([]);
  });

  it('flags a rule whose gradient and constant match', () => {
    expect(codes('$y = 3x + 3$')).toContain('gradient_equals_intercept');
    expect(codes('$y = -2x - 2$')).toContain('gradient_equals_intercept');
    expect(codes('$y = 3x + 2$')).toEqual([]);
  });

  it('flags 2 + 2 and 2 × 2, but not other sums', () => {
    expect(codes('$2 + 2 = 4$')).toContain('sum_equals_product');
    expect(codes('$2 \\times 2 = 4$')).toContain('sum_equals_product');
    expect(codes('$2 + 3 = 5$')).toEqual([]);
  });

  it('flags multiplying by 1 and products of the same number', () => {
    expect(codes('$7 \\times 1 = 7$')).toContain('times_one');
    expect(codes('Girls: $4 \\times 4 = 16$.')).toContain('same_operands');
    expect(codes('Girls: $4 \\times 5 = 20$.')).toEqual([]);
  });

  it('flags points with equal coordinates, but not the origin', () => {
    expect(codes('Plot $(3, 3)$')).toContain('equal_coordinates');
    expect(codes('Plot $(0, 0)$ and $(2, 7)$')).toEqual([]);
  });
});

describe('checkRepeats', () => {
  it('flags the same rule in two examples', () => {
    const r = checkRepeats([
      { label: 'I do', md: 'So $y = 3x + 4$.' },
      { label: 'Hinge', md: 'Which rule? $y = 3x + 4$' },
    ]);
    expect(r.map((i) => i.code)).toEqual(['repeated_example']);
  });
});

// Every static unit and the demo lesson follow the number rules (prompts/_maths-examples.md).
describe('static content follows the number rules', () => {
  const dir = join(import.meta.dirname, '../../content/units');
  for (const f of readdirSync(dir)) {
    const u = JSON.parse(readFileSync(join(dir, f), 'utf8')) as {
      coreIdeaMd: string;
      workedExampleMd?: string;
      checkItems: { id: string; stemMd: string; options?: string[]; feedbackIncorrect: string }[];
    };
    it(f, () => {
      const examples = [
        { label: 'worked example', md: u.workedExampleMd ?? '' },
        ...u.checkItems.map((c) => ({
          label: c.id,
          md: [c.stemMd, ...(c.options ?? []), c.feedbackIncorrect].join('\n'),
        })),
      ];
      const issues = [
        ...[...examples, { label: 'core idea', md: u.coreIdeaMd }].flatMap((e) =>
          checkNumbers(e.md).map((i) => `${e.label}: ${i.message}`),
        ),
        ...checkRepeats(examples).map((i) => i.message),
      ];
      expect(issues).toEqual([]);
    });
  }

  it('demo lesson', () => {
    const file = JSON.parse(
      readFileSync(
        join(import.meta.dirname, '../../content/lessons/demo-tammy-linear.json'),
        'utf8',
      ),
    ) as { lesson?: { blocks: never[] }; blocks?: never[] };
    const blocks = (file.lesson ?? file).blocks ?? [];
    expect(lessonNumberIssues(blocks)).toEqual({});
  });
});

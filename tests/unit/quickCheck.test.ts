import { describe, expect, it } from 'vitest';
import { UNITS } from '@shared/catalogue';
import {
  answerFlow,
  moveOnForNow,
  nextParallel,
  questionAt,
  startFlow,
  toAttempt,
  visibleCount,
  wrongFeedback,
} from '@shared/quickCheck';
import type { CheckItem, CheckQuestion } from '@shared/types';

const items = UNITS.flatMap((u) => u.checkItems);
const item = (id: string) => items.find((q) => q.id === id)!;

describe('quick check flow', () => {
  const q = item('lin-02-q1');

  it('right first time moves on', () => {
    const s = answerFlow(q, startFlow(), '$y = 4x + 5$');
    expect(s.phase).toBe('done');
    expect(toAttempt(q, s)?.outcome).toBe('first_try');
  });

  it('a wrong answer gives targeted feedback, then a parallel item, and records uptake', () => {
    let s = answerFlow(q, startFlow(), '$y = x + 4$');
    expect(s.phase).toBe('feedback');
    expect(wrongFeedback(q, '$y = x + 4$').misconceptionId).toBe('mis-linear-constant-only');
    s = nextParallel(q, s);
    expect(questionAt(q, s.step).id).toBe('lin-02-q1-p1');
    s = answerFlow(q, s, '$y = 3x + 2$');
    const a = toAttempt(q, s)!;
    expect(a.outcome).toBe('after_feedback');
    expect(a.tries).toBe(2);
    expect(a.misconceptionIds).toEqual(['mis-linear-constant-only']);
  });

  it('wrong twice offers one more try or moving on, and caps at three questions', () => {
    let s = answerFlow(q, startFlow(), '$y = 5x + 4$');
    s = answerFlow(q, nextParallel(q, s), '$y = x + 3$');
    expect(s.phase).toBe('feedback');
    expect(toAttempt(q, moveOnForNow(s))?.outcome).toBe('needs_support');
    s = answerFlow(q, nextParallel(q, s), '$y = 7x + 2$');
    expect(s.phase).toBe('done');
    const a = toAttempt(q, s)!;
    expect(a.outcome).toBe('needs_support');
    expect(a.tries).toBe(3);
    expect(a.misconceptionIds).toEqual(['mis-gradient-intercept-swap', 'mis-linear-constant-only']);
    expect(nextParallel(q, s)).toBe(s);
  });

  it('right on the last parallel counts as right after a worked solution', () => {
    let s = answerFlow(q, startFlow(), '$y = x + 4$');
    s = answerFlow(q, nextParallel(q, s), '$y = x + 3$');
    s = answerFlow(q, nextParallel(q, s), '$y = 2x + 7$');
    expect(toAttempt(q, s)?.outcome).toBe('after_worked_solution');
  });

  it('a question that is not incremental moves on after one answer', () => {
    const plain = item('lin-04-q1');
    const s = answerFlow(plain, startFlow(), 'Uneven scale');
    expect(s.phase).toBe('done');
    expect(toAttempt(plain, s)?.outcome).toBe('wrong');
  });

  it('holds back the questions after an unresolved incremental one', () => {
    const qs = UNITS.find((u) => u.id === 'lin-02-table-to-rule')!.checkItems;
    expect(visibleCount(qs, {})).toBe(1);
    expect(visibleCount(qs, { 'lin-02-q1': true })).toBe(2);
    const plain = UNITS.find((u) => u.id === 'lin-04-graphing-errors')!.checkItems;
    expect(visibleCount(plain, {})).toBe(2);
  });
});

// Every incremental item and its parallels are recomputed from the numbers in the question, so a
// typo in an answer, a second correct option or a missing misconception distractor fails here.

const nums = (s: string) => s.split(',').map((n) => Number(n.trim()));
const sameMaths = (a: string, b: string) => a.replace(/[$\s]/g, '') === b.replace(/[$\s]/g, '');
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

type Verifier = (q: CheckQuestion) => { answer: string; distractors: string[] };

const VERIFIERS: Record<string, Verifier> = {
  'algebra.equals-as-balance': (q) => {
    const m = /\$(\d+) ([+-]) (\d+) = (\d+) ([+-]) (\d+)\$/.exec(q.stemMd)!;
    const side = (a: string, op: string, b: string) =>
      op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
    const left = side(m[1]!, m[2]!, m[3]!);
    const right = side(m[4]!, m[5]!, m[6]!);
    return left === right
      ? { answer: 'True', distractors: ['False'] }
      : { answer: 'False', distractors: ['True'] };
  },
  'algebra.collect-like-terms': (q) => {
    const m = /Simplify \$(\d+)([a-z]) \+ (\d+)([a-z]) - (\d+)([a-z])\$/.exec(q.stemMd)!;
    const [a, p, b, r, c, p2] = [Number(m[1]), m[2]!, Number(m[3]), m[4]!, Number(m[5]), m[6]!];
    expect(p2).toBe(p);
    expect(r).not.toBe(p);
    expect(a - c).toBeGreaterThan(1);
    return {
      answer: `$${a - c}${p} + ${b}${r}$`,
      distractors: [`$${a + b - c}${p}${r}$`, `$${a + c}${p} + ${b}${r}$`],
    };
  },
  'algebra.table-to-rule': (q) => {
    const m = /\$x\$: ([\d, ]+) and \$y\$: ([\d, ]+)\./.exec(q.stemMd)!;
    const xs = nums(m[1]!);
    const ys = nums(m[2]!);
    expect(xs).toEqual(xs.map((_, i) => i));
    const step = ys[1]! - ys[0]!;
    ys.forEach((y, i) => expect(y).toBe(ys[0]! + step * i));
    const c = ys[0]!;
    // Keeps the two misconception distractors different from each other and from the answer.
    expect(step).toBeGreaterThan(1);
    expect(c).toBeGreaterThan(1);
    expect(step).not.toBe(c);
    return {
      answer: `$y = ${step}x + ${c}$`,
      distractors: [`$y = x + ${step}$`, `$y = ${c}x + ${step}$`],
    };
  },
  'number.ratio-to-fraction': (q) => {
    const m =
      /^(\w+) and (\w+) .*ratio \$(\d+) : (\d+)\$\. What fraction of the \w+ is (\w+)\?$/.exec(
        q.stemMd,
      )!;
    const [first, second, a, b, asked] = [m[1]!, m[2]!, Number(m[3]), Number(m[4]), m[5]!];
    const isFirst = asked.toLowerCase() === first.toLowerCase();
    expect(isFirst || asked.toLowerCase() === second.toLowerCase()).toBe(true);
    const part = isFirst ? a : b;
    const other = isFirst ? b : a;
    expect(gcd(part, a + b)).toBe(1);
    return {
      answer: `$\\frac{${part}}{${a + b}}$`,
      distractors: [`$\\frac{${part}}{${other}}$`, `$\\frac{${other}}{${a + b}}$`],
    };
  },
};

describe('incremental quick check items', () => {
  const incremental = items.filter((q): q is CheckItem => !!q.incremental);

  it('exist, and each has a skill the maths can be checked for', () => {
    expect(incremental.map((q) => q.id).sort()).toEqual([
      'alg-01-q1',
      'alg-02-q1',
      'lin-02-q1',
      'prop-03-q1',
    ]);
    for (const q of incremental) expect(VERIFIERS[q.skill!]).toBeDefined();
  });

  for (const q of incremental)
    for (const v of [q, ...(q.parallels ?? [])])
      it(`${v.id} has exactly one correct answer, and it is the one marked`, () => {
        const { answer, distractors } = VERIFIERS[q.skill!]!(v);
        expect(sameMaths(v.answer, answer)).toBe(true);
        const opts = v.options ?? [];
        expect(opts.filter((o) => sameMaths(o, answer))).toHaveLength(1);
        for (const d of distractors) expect(opts.some((o) => sameMaths(o, d))).toBe(true);
        // Every wrong option has its own targeted feedback.
        for (const o of opts.filter((x) => !sameMaths(x, answer)))
          expect((v.wrongAnswers ?? []).some((w) => sameMaths(w.answer, o))).toBe(true);
      });

  it('parallels use different numbers and vary where the answer sits', () => {
    for (const q of incremental) {
      const all = [q, ...(q.parallels ?? [])];
      expect(new Set(all.map((v) => v.stemMd)).size).toBe(all.length);
      if ((q.options ?? []).length > 2)
        expect(new Set(all.map((v) => v.options!.indexOf(v.answer))).size).toBeGreaterThan(1);
    }
  });
});

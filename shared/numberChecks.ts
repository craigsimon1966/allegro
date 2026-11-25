// Number choice checks for worked examples and practice questions.
//
// A teacher reading "when x = 1, y = 1" can't tell which 1 belongs to which letter, and a
// student who sees 2 + 2 = 4 next to 2 × 2 = 4 can't tell which operation gave the answer.
// These checks flag numbers that hide the mathematics, so static units are kept clean (a unit
// test runs them over every unit) and AI drafts get a visible "number check" note.
// Pure and small on purpose: it runs in the browser, in Pages Functions and in tests.

export type NumberIssueCode =
  | 'same_value_letters'
  | 'gradient_equals_intercept'
  | 'sum_equals_product'
  | 'times_one'
  | 'same_operands'
  | 'equal_coordinates'
  | 'repeated_example';

export interface NumberIssue {
  code: NumberIssueCode;
  message: string;
}

const NUM = String.raw`-?\d+(?:\.\d+)?`;

/** Turn LaTeX and Markdown maths into plain text that the patterns below can read. */
export function plainForChecks(md: string): string {
  return md
    .replace(/\\times|×|\\cdot/g, '×')
    .replace(/\\div|÷/g, '÷')
    .replace(/\\left|\\right/g, '')
    .replace(/[$*]/g, '')
    .replace(/−/g, '-')
    .replace(/\\,/g, ' ');
}

/** A number written in the text, e.g. "-3" or "2.5", as a JS number. */
const n = (s: string) => Number(s);

/** One line or table row at a time, so separate questions don't trip each other up. */
function lines(md: string): string[] {
  return plainForChecks(md)
    .split(/\n|(?<=[.?!])\s+(?=[A-Z0-9])/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function sameValueLetters(line: string): NumberIssue[] {
  // "x = 1" but not "x = 1x" or "y = 2x + 1" (a rule, not a value).
  const re = new RegExp(String.raw`(?<![A-Za-z\\])([a-z])\s*=\s*(${NUM})(?![\d.]*[a-z(])`, 'g');
  const seen = new Map<string, string>();
  const issues: NumberIssue[] = [];
  for (const m of line.matchAll(re)) {
    const letter = m[1]!;
    const value = n(m[2]!).toString();
    const other = [...seen.entries()].find(([l, v]) => v === value && l !== letter);
    if (other)
      issues.push({
        code: 'same_value_letters',
        message: `${other[0]} and ${letter} are both ${value}, so it's hard to tell which value belongs to which letter. Choose different values.`,
      });
    seen.set(letter, value);
  }
  return issues;
}

function gradientEqualsIntercept(line: string): NumberIssue[] {
  // y = 3x + 3 or y = -2x - 2: the gradient and the constant look the same.
  const re = new RegExp(
    String.raw`=\s*(${NUM})\s*([a-z])\s*([+-])\s*(\d+(?:\.\d+)?)(?![\d.]*\s*[a-z])`,
    'g',
  );
  const issues: NumberIssue[] = [];
  for (const m of line.matchAll(re)) {
    const coef = Math.abs(n(m[1]!));
    const c = n(m[4]!);
    if (coef === c && coef !== 0)
      issues.push({
        code: 'gradient_equals_intercept',
        message: `In ${m[0].replace(/^=\s*/, '').trim()} the number multiplying ${m[2]} and the number added are both ${c}, so students can't see which one is the rate of change. Use two different numbers.`,
      });
  }
  return issues;
}

function sumEqualsProduct(line: string): NumberIssue[] {
  // 2 + 2 and 2 × 2 both give 4, so the example doesn't show which operation was used.
  const re = new RegExp(String.raw`(?<![\d.])(${NUM})\s*([+×])\s*(${NUM})(?![\d.])`, 'g');
  const issues: NumberIssue[] = [];
  for (const m of line.matchAll(re)) {
    const a = n(m[1]!);
    const b = n(m[3]!);
    if (a + b === a * b)
      issues.push({
        code: 'sum_equals_product',
        message: `${a} ${m[2]} ${b} gives the same answer as ${a} ${m[2] === '+' ? '×' : '+'} ${b}, so the example can't show which operation matters. Pick other numbers.`,
      });
  }
  return issues;
}

function timesOne(line: string): NumberIssue[] {
  // ×1, ÷1 and "1x" hide the step the example is meant to show.
  const issues: NumberIssue[] = [];
  if (/[×÷]\s*1(?![\d.])/.test(line) || /(?<![\d.\w])1\s*×\s*\d/.test(line))
    issues.push({
      code: 'times_one',
      message: 'Multiplying or dividing by 1 hides the step. Use a different number.',
    });
  return issues;
}

function sameOperands(line: string): NumberIssue[] {
  // 4 × 4 = 16 in a ratio question: which 4 is the number of parts and which is the size?
  const re = new RegExp(String.raw`(?<![\d.^])(${NUM})\s*×\s*(${NUM})(?![\d.])`, 'g');
  return [...line.matchAll(re)]
    .filter((m) => n(m[1]!) === n(m[2]!) && Math.abs(n(m[1]!)) > 1)
    .map((m) => ({
      code: 'same_operands' as const,
      message: `${m[1]} × ${m[2]} uses the same number twice, so students can't tell which ${m[1]} is which. Choose numbers that differ.`,
    }));
}

function equalCoordinates(line: string): NumberIssue[] {
  // The point (3, 3) can't show whether a student went across first or up first.
  const re = new RegExp(String.raw`\(\s*(${NUM})\s*,\s*(${NUM})\s*\)`, 'g');
  return [...line.matchAll(re)]
    .filter((m) => n(m[1]!) === n(m[2]!) && n(m[1]!) !== 0)
    .map((m) => ({
      code: 'equal_coordinates' as const,
      message: `The point (${m[1]}, ${m[2]}) has the same x and y value, so it can't show which coordinate comes first. Use a point with different values.`,
    }));
}

/** Problems with the numbers inside one worked example or question. */
export function checkNumbers(md: string): NumberIssue[] {
  const out: NumberIssue[] = [];
  for (const line of lines(md))
    out.push(
      ...sameValueLetters(line),
      ...gradientEqualsIntercept(line),
      ...sumEqualsProduct(line),
      ...timesOne(line),
      ...sameOperands(line),
      ...equalCoordinates(line),
    );
  return dedupe(out);
}

/** Rules and equations written in a piece of Markdown, normalised for comparison. */
export function equationsIn(md: string): string[] {
  const re = new RegExp(
    String.raw`(?<![A-Za-z])[a-z]\s*=\s*${NUM}?\s*[a-z]\s*[+-]\s*${NUM}|\b${NUM}\s*[a-z]\s*[+-]\s*${NUM}\s*=\s*${NUM}`,
    'g',
  );
  return [...plainForChecks(md).matchAll(re)].map((m) => m[0].replace(/\s+/g, ''));
}

/**
 * The same rule or equation used in more than one example makes a set of questions feel
 * samey and lets students copy the earlier answer. Pass each example separately.
 */
export function checkRepeats(examples: { label: string; md: string }[]): NumberIssue[] {
  const firstSeen = new Map<string, string>();
  const out: NumberIssue[] = [];
  for (const ex of examples) {
    for (const eq of new Set(equationsIn(ex.md))) {
      const prior = firstSeen.get(eq);
      if (prior && prior !== ex.label)
        out.push({
          code: 'repeated_example',
          message: `${eq} appears in both ${prior} and ${ex.label}. Vary the numbers so each example is new.`,
        });
      else if (!prior) firstSeen.set(eq, ex.label);
    }
  }
  return dedupe(out);
}

function dedupe(issues: NumberIssue[]): NumberIssue[] {
  const seen = new Set<string>();
  return issues.filter((i) => (seen.has(i.message) ? false : (seen.add(i.message), true)));
}

/** Number issues for each block of a lesson, keyed by block id (repeats are listed on the later block). */
export function lessonNumberIssues(
  blocks: { id: string; title: string; content_md: string }[],
): Record<string, NumberIssue[]> {
  const out: Record<string, NumberIssue[]> = {};
  const seen = new Map<string, string>();
  for (const b of blocks) {
    const issues = checkNumbers(b.content_md);
    for (const eq of new Set(equationsIn(b.content_md))) {
      const prior = seen.get(eq);
      if (prior)
        issues.push({
          code: 'repeated_example',
          message: `${eq} is also used in ${prior}. Vary the numbers so each example is new.`,
        });
      else seen.set(eq, b.title);
    }
    if (issues.length) out[b.id] = dedupe(issues);
  }
  return out;
}

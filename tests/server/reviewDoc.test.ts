// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { blocks, blocksToMarkdown, inline, plainMaths, runsText } from '../../scripts/reviewDoc';

describe('review document text', () => {
  it('writes maths as it would look on paper', () => {
    expect(plainMaths('2 \\times 3 + 6 \\div 2')).toBe('2 × 3 + 6 ÷ 2');
    expect(plainMaths('\\frac{3}{4}')).toBe('3/4');
    expect(plainMaths('\\frac{x+1}{2}')).toBe('(x+1)/2');
    expect(plainMaths('7 + 5 = \\square + 8')).toBe('7 + 5 = □ + 8');
  });
  it('keeps bold, italic and maths runs', () => {
    const r = inline('**Rule:** $y = 2x + 1$ for *x*');
    expect(runsText(r)).toBe('Rule: y = 2x + 1 for x');
    expect(r[0]).toMatchObject({ text: 'Rule:', bold: true });
    expect(r.at(-1)).toMatchObject({ text: 'x', italic: true });
  });
  it('splits paragraphs, lists and tables', () => {
    const b = blocks('Intro line\n\n1. One\n2. Two\n\n| *x* | 0 |\n|---|---|\n| *y* | 1 |');
    expect(b.map((x) => x.kind)).toEqual(['para', 'list', 'table']);
    expect(b[2]).toMatchObject({ kind: 'table' });
    expect(blocksToMarkdown(b)).toContain('| *x* | 0 |\n| --- | --- |\n| *y* | 1 |');
  });
});

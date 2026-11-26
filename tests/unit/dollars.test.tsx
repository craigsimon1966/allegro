import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { render } from '@testing-library/react';
import { MathText } from '@/components/MathText';
import { latexToMath } from '@/lib/latexToDocx';
import { KATEX_MACROS, protectDollars } from '@shared/dollars';
import { inline, runsText } from '@shared/markdownBlocks';

// A real Year 11 financial maths lesson from the live AI wrote money like this.
const LESSON = 'Calculate $25\\%$ of $\\$80$. A worker earns $\\$22$ per hour: $22 \\times 7 = \\$154$.';

describe('dollar signs in maths', () => {
  it('rewrites \\$ inside maths only, and is idempotent', () => {
    const out = protectDollars(LESSON);
    expect(out).toBe(
      'Calculate $25\\%$ of $\\dollar{}80$. A worker earns $\\dollar{}22$ per hour: $22 \\times 7 = \\dollar{}154$.',
    );
    expect(protectDollars(out)).toBe(out);
    expect(protectDollars('It costs \\$5 and \\$6.')).toBe('It costs \\$5 and \\$6.');
    expect(protectDollars('```\n$\\$1$\n```')).toBe('```\n$\\$1$\n```');
  });

  it('keeps every maths span closed where the author closed it', () => {
    expect(protectDollars(LESSON).match(/(?<!\\)\$/g)).toHaveLength(8);
  });

  it('renders \\dollar as a dollar sign in KaTeX', () => {
    const html = katex.renderToString('\\dollar{}80', { macros: { ...KATEX_MACROS } });
    expect(html).toContain('$');
  });

  it('Word and slide text reads as money, not broken maths', () => {
    expect(runsText(inline(LESSON))).toBe(
      'Calculate 25% of $80. A worker earns $22 per hour: 22 × 7 = $154.',
    );
    expect(runsText(inline('The \\$1100 to \\$1149 row'))).toBe('The $1100 to $1149 row');
  });

  it('the lesson screen shows the money and no stray maths', () => {
    const { container } = render(<MathText>{LESSON}</MathText>);
    const mathml = [...container.querySelectorAll('annotation')].map((a) => a.textContent);
    expect(mathml).toEqual(['25\\%', '\\dollar{}80', '\\dollar{}22', '22 \\times 7 = \\dollar{}154']);
    expect(container.querySelector('.katex-error')).toBeNull();
    expect(container.textContent).toContain('per hour');
  });

  it('Word equations turn \\dollar into a dollar sign', () => {
    expect(latexToMath('\\dollar{}80').length).toBeGreaterThan(0);
  });

  it('a whole worked example with tables, display maths and bold renders with no stray maths', () => {
    const md = [
      '| Weekly gross pay | Tax withheld |',
      '|---|---|',
      '| \\$1100 to \\$1149 | \\$209 |',
      '',
      'The gross pay of $\\$1144$ falls in the \\$1100 to \\$1149 row, so tax withheld is $\\$209$.',
      '',
      '$$\\text{Net pay} = 1144 - 209 = \\$935$$',
      '',
      '- **A ($\\$110$):** students added $\\$10$ to the rate for each hour ($20 + 10 = 30$).',
    ].join('\n');
    const { container } = render(<MathText>{md}</MathText>);
    const tex = [...container.querySelectorAll('annotation')].map((a) => a.textContent);
    expect(tex).toEqual([
      '\\dollar{}1144',
      '\\dollar{}209',
      '\\text{Net pay} = 1144 - 209 = \\dollar{}935',
      '\\dollar{}110',
      '\\dollar{}10',
      '20 + 10 = 30',
    ]);
    expect(container.querySelector('td')?.textContent).toBe('$1100 to $1149');
    expect(container.querySelector('.katex-error')).toBeNull();
  });
});

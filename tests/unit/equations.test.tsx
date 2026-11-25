import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { Document, Packer, Paragraph } from 'docx';
import { strFromU8, unzipSync } from 'fflate';
import { cleanLatex, equationAt, insertEquation } from '@/lib/mathInsert';
import { latexToMath } from '@/lib/latexToDocx';
import { MathTextarea } from '@/components/MathTextarea';
import { Math as WordMath } from 'docx';

describe('inserting equations into text', () => {
  it('finds the equation under the cursor', () => {
    const t = 'Solve $2x + 3 = 11$ for x.';
    expect(equationAt(t, 9, 9)).toEqual({ start: 6, end: 19, latex: '2x + 3 = 11' });
    expect(equationAt(t, 2, 2)).toBeNull();
    expect(equationAt(t, 19, 19)).toBeNull();
  });

  it('inserts at the cursor with spaces around it', () => {
    expect(insertEquation('Work out then check.', 8, 8, '\\frac{3}{4}')).toEqual({
      text: 'Work out $\\frac{3}{4}$ then check.',
      caret: 22,
    });
    expect(insertEquation('Answer:', 7, 7, 'x=4').text).toBe('Answer: $x=4$');
    expect(insertEquation('Find .', 5, 5, 'y').text).toBe('Find $y$.');
  });

  it('replaces an equation being edited and ignores an empty one', () => {
    const t = 'Solve $2x + 3 = 11$ for x.';
    expect(insertEquation(t, 6, 19, '2x + 5 = 13').text).toBe('Solve $2x + 5 = 13$ for x.');
    expect(insertEquation(t, 6, 6, '\\placeholder{}').text).toBe(t);
  });

  it('cleans MathLive extras', () => {
    expect(cleanLatex('x^{\\placeholder{}}+\\exponentialE')).toBe('x^{}+e');
  });
});

async function wordXml(tex: string) {
  const doc = new Document({
    sections: [
      { children: [new Paragraph({ children: [new WordMath({ children: latexToMath(tex) })] })] },
    ],
  });
  const files = unzipSync(new Uint8Array(await Packer.toBuffer(doc)));
  return strFromU8(files['word/document.xml']!);
}

describe('equations in Word', () => {
  it('builds fractions, powers, roots and brackets as Word equations', async () => {
    const xml = await wordXml('\\frac{3}{4} + x^{2} - \\sqrt{9} \\times \\left(a_1 + 2\\right)');
    expect(xml).toContain('<m:oMath>');
    expect(xml).toContain('<m:f>');
    expect(xml).toContain('<m:sSup>');
    expect(xml).toContain('<m:rad>');
    expect(xml).toContain('<m:sSub>');
    expect(xml).toContain('<m:d>');
    const text = xml.replace(/<[^>]+>/g, '');
    expect(text).toContain('×');
    expect(text).toContain('−');
    expect(text).not.toContain('\\');
  });

  it('puts a power on the last character only', async () => {
    const xml = await wordXml('2x^2');
    expect(xml).toMatch(/<m:t[^>]*>2<\/m:t>.*<m:sSup>.*<m:t[^>]*>x<\/m:t>/s);
  });
});

function Harness() {
  const [v, setV] = useState('Rule: $y = 2x - 7$');
  return <MathTextarea id="t" value={v} onChange={setV} aria-label="Notes" />;
}

describe('MathTextarea', () => {
  it('has an Insert maths button and previews the maths', () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole('button', { name: /Insert maths/ })).toBeInTheDocument();
    expect(container.querySelector('.math-preview .katex')).not.toBeNull();
  });
});

describe('cleanLatex braces', () => {
  it('writes MathLive short forms in full', () => {
    expect(cleanLatex('y=\\frac34x-5')).toBe('y=\\frac{3}{4}x-5');
    expect(cleanLatex('\\frac{12}5+\\sqrt2')).toBe('\\frac{12}{5}+\\sqrt{2}');
  });
});

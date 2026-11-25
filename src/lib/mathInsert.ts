// Pure helpers for the "Insert maths" button: find the $...$ equation under the cursor and put
// an edited or new equation back into the text. Kept apart from React so they can be tested.

/** The inline equation that contains the cursor or selection, if any. */
export function equationAt(
  text: string,
  start: number,
  end: number,
): { start: number; end: number; latex: string } | null {
  for (const m of text.matchAll(/(?<!\$)\$([^$\n]+)\$(?!\$)/g)) {
    const s = m.index!;
    const e = s + m[0].length;
    // Inside the equation, not just touching its closing $.
    if (start > s && end < e) return { start: s, end: e, latex: m[1]! };
  }
  return null;
}

/** Tidies MathLive's LaTeX for KaTeX and for teachers reading the raw text. */
export function cleanLatex(latex: string): string {
  return (
    latex
      .replace(/\\placeholder(\[[^\]]*\])?\{[^}]*\}/g, '')
      .replace(/\\exponentialE/g, 'e')
      .replace(/\\imaginaryI/g, 'i')
      .replace(/\\differentialD/g, 'd')
      // MathLive writes \frac34; teachers read \frac{3}{4} more easily (KaTeX takes both).
      .replace(/\\frac\s*([^{\s\\])\s*([^{\s\\])/g, '\\frac{$1}{$2}')
      .replace(/\\frac\s*(\{[^{}]*\})\s*([^{\s\\])/g, '\\frac$1{$2}')
      .replace(/\\sqrt\s*([^{[\s\\])/g, '\\sqrt{$1}')
      .trim()
  );
}

/** Puts $latex$ in place of text[start, end) and returns the new text and the caret after it. */
export function insertEquation(
  text: string,
  start: number,
  end: number,
  latex: string,
): { text: string; caret: number } {
  const clean = cleanLatex(latex);
  if (!clean) return { text, caret: end };
  const before = text.slice(0, start);
  const after = text.slice(end);
  // Keep a space between the equation and touching words.
  const lead = before && !/\s$/.test(before) ? ' ' : '';
  const trail = after && !/^[\s.,;:!?)]/.test(after) ? ' ' : '';
  const eq = `${lead}$${clean}$${trail}`;
  return { text: before + eq + after, caret: before.length + eq.length };
}

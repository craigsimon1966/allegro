import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// TECH_SPEC 9.5: every colour pair used for text meets WCAG AA.
const css = readFileSync('src/styles/tokens.css', 'utf8');

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m?.[1]) throw new Error(`Token --${name} not found`);
  return m[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

// [text, background, minimum]
const PAIRS: [string, string, number][] = [
  ['ink', 'surface', 4.5],
  ['ink', 'sage-500', 4.5],
  ['ink', 'sage-100', 4.5],
  ['ink', 'highlighter', 4.5],
  ['muted', 'white', 4.5],
  ['green-700', 'white', 4.5],
  ['white', 'green-700', 4.5],
  ['white', 'green-800', 4.5],
  ['green-700', 'sage-100', 4.5],
  ['plum-500', 'white', 4.5],
  ['plum-500', 'surface', 4.5],
  ['plum-700', 'plum-100', 4.5],
  ['warning', 'white', 4.5],
  ['error', 'white', 4.5],
  ['info', 'white', 4.5],
  ['green-600', 'white', 3], // large text only
];

describe('contrast', () => {
  it.each(PAIRS)('%s on %s meets %s:1', (fg, bg, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('white on sage fails, so it must never be used for text', () => {
    expect(ratio('white', 'sage-500')).toBeLessThan(3);
  });
});

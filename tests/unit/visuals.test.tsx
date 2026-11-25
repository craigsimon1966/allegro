import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describeVisual, parseVisual, visualBlocksIn, visualSvg } from '@shared/visuals';
import { MathText } from '@/components/MathText';

describe('maths visuals', () => {
  it('draws a graph from a rule, with a description for screen readers', () => {
    const r = parseVisual(
      '{"type":"graph","xMin":-2,"xMax":3,"yMin":-4,"yMax":8,"lines":[{"m":2,"c":-1}]}',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const { svg } = visualSvg(r.spec);
    expect(svg).toMatch(/^<svg /);
    expect(describeVisual(r.spec)).toBe(
      'Graph with x from −2 to 3 and y from −4 to 8, the line y = 2x − 1.',
    );
  });

  it('escapes labels so a spec cannot inject markup', () => {
    const r = parseVisual(
      '{"type":"bar_model","bars":[{"label":"<script>","parts":[{"label":"a\\"b"}]}]}',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const { svg } = visualSvg(r.spec);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('rejects specs that are not JSON or out of range', () => {
    expect(parseVisual('not json').ok).toBe(false);
    expect(parseVisual('{"type":"array","rows":40,"cols":2}').ok).toBe(false);
    expect(parseVisual('{"type":"spiral"}').ok).toBe(false);
  });

  it('MathText renders a ```visual block as a figure, and a broken one as a note', () => {
    const md =
      'Before.\n\n```visual\n{"type":"number_line","min":-3,"max":4,"jumps":[{"from":-2,"to":3,"label":"+5"}]}\n```\n\nAfter.\n\n```visual\n{oops}\n```';
    const { container } = render(<MathText>{md}</MathText>);
    expect(container.querySelector('figure.math-visual svg[role="img"]')).not.toBeNull();
    expect(container.querySelector('.math-visual-error')).not.toBeNull();
    expect(container.textContent).toContain('After.');
  });

  it('every visual in the static units parses', () => {
    const dir = join(import.meta.dirname, '../../content/units');
    const bad: string[] = [];
    let count = 0;
    for (const f of readdirSync(dir)) {
      const text = readFileSync(join(dir, f), 'utf8');
      const u = JSON.parse(text) as Record<string, unknown>;
      for (const v of Object.values(u))
        if (typeof v === 'string')
          for (const raw of visualBlocksIn(v)) {
            count++;
            const r = parseVisual(raw);
            if (!r.ok) bad.push(`${f}: ${r.error}`);
          }
    }
    expect(bad).toEqual([]);
    expect(count).toBeGreaterThanOrEqual(7);
  });
});

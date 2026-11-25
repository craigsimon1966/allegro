import { parseVisual, visualSvg } from '@shared/visuals';

/**
 * A maths diagram (bar model, number line, graph...) drawn from a ```visual block.
 * The SVG is built by shared/visuals.ts from checked numbers and escaped labels, never from
 * raw AI markup, so it is safe to insert. A spec that doesn't parse shows a quiet note.
 */
export function MathVisual({ source }: { source: string }) {
  const parsed = parseVisual(source);
  if (!parsed.ok)
    return (
      <p className="math-visual-error text-[15px] text-muted">
        (A diagram was meant to go here but couldn&apos;t be drawn.)
      </p>
    );
  const { svg, width } = visualSvg(parsed.spec);
  return (
    <figure
      className="math-visual my-4 max-w-full overflow-x-auto"
      style={{ width: Math.min(width, 560) }}
      dangerouslySetInnerHTML={{ __html: svg.replace(/width="\d+" height="\d+"/, 'width="100%"') }}
    />
  );
}

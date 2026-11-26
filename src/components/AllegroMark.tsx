export type Product = 'equip' | 'embed' | 'evaluate' | 'elevate' | 'all';

interface Props {
  /** Which circle is filled. 'all' shows the plain brand mark with every circle outlined. */
  product?: Product;
  size?: number;
  tone?: 'green' | 'ink' | 'white';
  /** Waiting state: Craig's icon in plum, turning slowly. Honours prefers-reduced-motion. */
  loading?: boolean;
  /** Accessible name. Omit when the mark is decorative. */
  label?: string;
  className?: string;
}

// Clockwise from top-left: Equip, Embed, Evaluate, Elevate (SPEC 10.4, decided 27 Oct 2026).
// Centres and radius are fitted to Craig's brand icon (public/brand/icon.svg, viewBox 375), so this
// mark is the same four circles as the logo, not a simplified grid.
const CIRCLES: { product: Exclude<Product, 'all'>; cx: number; cy: number }[] = [
  { product: 'equip', cx: 136.6, cy: 133 },
  { product: 'embed', cx: 235.9, cy: 132 },
  { product: 'evaluate', cx: 239.5, cy: 239.8 },
  { product: 'elevate', cx: 132.2, cy: 236.4 },
];
const R = 73.7;

/**
 * The four-circle Allegro mark, drawn in code (not an image) so a circle can be filled for a
 * product and the circles can fill in turn while something loads.
 */
export function AllegroMark({
  product = 'all',
  size = 28,
  tone = 'green',
  loading = false,
  label,
  className,
}: Props) {
  const colour = { green: 'var(--green-700)', ink: 'var(--ink)', white: 'var(--white)' }[tone];
  if (loading)
    // The waiting mark is Craig's own icon in plum, turning (public/brand/icon-plum.svg).
    return (
      <img
        src="/brand/icon-plum.svg"
        width={size}
        height={size}
        alt={label ?? ''}
        aria-hidden={label ? undefined : true}
        className={['allegro-mark-spin', className ?? ''].join(' ').trim()}
      />
    );
  return (
    <svg
      width={size}
      height={size}
      viewBox="54 54 268 268"
      style={{ color: colour }}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {CIRCLES.map((c) => (
        <circle
          key={c.product}
          data-product={c.product}
          cx={c.cx}
          cy={c.cy}
          r={R}
          fill={c.product === product ? colour : 'none'}
          stroke={colour}
          strokeWidth={Math.max(1.5, size / 24)}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

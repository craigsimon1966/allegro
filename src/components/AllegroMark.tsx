export type Product = 'equip' | 'embed' | 'evaluate' | 'elevate' | 'all';

interface Props {
  /** Which circle is filled. 'all' shows the plain brand mark with every circle outlined. */
  product?: Product;
  size?: number;
  tone?: 'green' | 'ink' | 'white';
  /** Circles fill in sequence (loading state). Honours prefers-reduced-motion. */
  loading?: boolean;
  /** Accessible name. Omit when the mark is decorative. */
  label?: string;
  className?: string;
}

// Clockwise from top-left: Equip, Embed, Evaluate, Elevate (SPEC 10.4, decided 27 Oct 2026).
const CIRCLES: { product: Exclude<Product, 'all'>; cx: number; cy: number }[] = [
  { product: 'equip', cx: 15, cy: 15 },
  { product: 'embed', cx: 29, cy: 15 },
  { product: 'evaluate', cx: 29, cy: 29 },
  { product: 'elevate', cx: 15, cy: 29 },
];

/**
 * The four-circle Allegro mark. Built from the simple circle geometry used in the design
 * reference screens until the cleaned brand SVGs arrive (spec-issues G1).
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
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      style={{ color: colour }}
      className={[loading ? 'allegro-mark-loading' : '', className ?? ''].join(' ').trim()}
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
          r={11}
          fill={!loading && c.product === product ? colour : 'none'}
          stroke={colour}
          strokeWidth={2.5}
        />
      ))}
    </svg>
  );
}

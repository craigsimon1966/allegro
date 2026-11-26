import { useMemo } from 'react';
import iconSvg from '@/assets/allegro-icon.svg?raw';
export type Product = 'equip' | 'embed' | 'evaluate' | 'elevate' | 'all';

interface Props {
  /** Which circle is filled in plum. 'all' shows the plain icon. */
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
// The drawing is Craig's own icon (Logos/Allegro icon.svg, kept in src/assets/allegro-icon.svg with
// its colours swapped for tokens), so the interlocking circles match the logo exactly. Each circle's
// inner area carries data-product, and the step's circle is filled to highlight it.
let instance = 0;
function iconMarkup(product: Product, uid: string) {
  return iconSvg
    .replace(/id="([^"]+)"/g, `id="${uid}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${uid}$1)`)
    .replace(
      `data-product="${product}" fill="var(--mark-bg)"`,
      `data-product="${product}" data-on="true" fill="var(--mark-fill)"`,
    );
}

/**
 * The Allegro icon. A product's circle is filled in plum; 'all' leaves every circle open.
 * While loading it shows the plum icon turning.
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
    <IconMark product={product} size={size} colour={colour} label={label} className={className} />
  );
}

function IconMark({
  product,
  size,
  colour,
  label,
  className,
}: {
  product: Product;
  size: number;
  colour: string;
  label?: string;
  className?: string;
}) {
  const html = useMemo(() => iconMarkup(product, `am${(instance += 1)}-`), [product]);
  return (
    <span
      className={['inline-block', className ?? ''].join(' ').trim()}
      style={
        {
          width: size,
          height: size,
          color: colour,
          '--mark-bg': 'var(--surface)',
          '--mark-fill': 'var(--plum-500)',
        } as React.CSSProperties
      }
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-product={product}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

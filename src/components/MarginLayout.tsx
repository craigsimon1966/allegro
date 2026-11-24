import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Graph paper background for learning screens and maths blocks (SPEC 10.6a). */
  grid?: boolean;
  className?: string;
}

/**
 * Page body with the 52px margin column and plum margin line (SPEC 10.6).
 * Phone: full width, content starts at 68px. Tablet: centred 600px page with its own margin.
 * Laptop: fills the main column (the sidebar sits outside it).
 */
export function MarginLayout({ children, grid = false, className = '' }: Props) {
  return (
    <div
      className={`relative mx-auto min-h-screen w-full sm:max-w-page lg:max-w-none ${grid ? 'graph-paper' : ''} ${className}`}
    >
      <div aria-hidden="true" className="margin-line" />
      <div className="relative pb-8 pl-content pr-5 pt-6 lg:pr-8">{children}</div>
    </div>
  );
}

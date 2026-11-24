import type { ElementType, ReactNode } from 'react';

/** Small uppercase section label (SPEC 10.2: 13px, 0.12em letter spacing). */
export function Label({
  children,
  as: As = 'div',
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  return (
    <As className={`text-[13px] uppercase tracking-[0.12em] text-muted ${className}`}>
      {children}
    </As>
  );
}

/** Section heading row: uppercase label over a 2px ink rule. */
export function SectionRule({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="border-b-2 border-rule-strong pb-1.5 font-body text-[13px] font-normal uppercase tracking-[0.12em] text-muted"
    >
      {children}
    </h2>
  );
}

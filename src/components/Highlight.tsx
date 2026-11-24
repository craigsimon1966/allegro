import type { ReactNode } from 'react';

/** Highlighter mark behind the lower part of the text. At most one per screen (SPEC 10.6a). */
export function Highlight({ children }: { children: ReactNode }) {
  return <span className="highlight">{children}</span>;
}

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tone?: 'plum' | 'muted' | 'green';
  /** Font size in px. Values under 20 are raised to 20 (SPEC 10.2). */
  size?: number;
  className?: string;
}

const TONES = { plum: 'text-plum-500', muted: 'text-muted', green: 'text-green-700' };

/**
 * Caveat annotation for ticks, "today", timings and short notes.
 * Rules (SPEC 10.2): one line, 20px or larger, never in inputs, buttons or instructions.
 * Must not carry information that exists nowhere else on screen.
 */
export function MarginNote({ children, tone = 'plum', size = 22, className = '' }: Props) {
  return (
    <span
      className={`inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-margin leading-tight ${TONES[tone]} ${className}`}
      style={{ fontSize: Math.max(20, size) }}
    >
      {children}
    </span>
  );
}

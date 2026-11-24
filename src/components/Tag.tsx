import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tone?: 'sage' | 'plum' | 'outline';
}

const TONES = {
  sage: 'bg-sage-100 text-ink',
  plum: 'bg-plum-100 text-plum-700',
  outline: 'border border-ink text-ink',
};

/** Small label with 2px corners. Never a pill. */
export function Tag({ children, tone = 'sage' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[13px] font-bold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

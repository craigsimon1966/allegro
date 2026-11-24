import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Highlight } from './Highlight';

interface Props {
  /** Margin slot: a step number, timing or short note. Ignored when done (a tick shows instead). */
  margin?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  /** Right-hand slot, usually a MarginNote such as "today". */
  aside?: ReactNode;
  done?: boolean;
  current?: boolean;
  to?: string;
}

/**
 * A row in a ruled list: 52px margin slot, content, 1px rule underneath (SPEC 10.3, 10.6a).
 * Completed rows are struck through in green with a tick, never removed.
 */
export function RuledRow({ margin, title, meta, aside, done, current, to }: Props) {
  const body = (
    <>
      <div
        className={`w-margin shrink-0 pt-3 text-center ${
          done
            ? 'font-margin text-[28px] leading-none text-green-700'
            : 'font-heading text-[22px] font-semibold text-green-700'
        }`}
      >
        {done ? <span aria-label="Done">✓</span> : margin}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-3.5 pl-4">
        <div
          className={`text-[17px] ${current ? 'font-bold' : ''} ${
            done ? 'text-muted line-through decoration-green-700' : ''
          }`}
        >
          {current ? <Highlight>{title}</Highlight> : title}
        </div>
        {meta && <div className="text-[13px] text-muted">{meta}</div>}
      </div>
      {aside && <div className="shrink-0 pr-5 pt-2">{aside}</div>}
    </>
  );
  const cls = 'flex min-h-[64px] items-start border-b border-rule text-ink no-underline';
  return to ? (
    <Link
      to={to}
      className={`${cls} hover:bg-sage-100`}
      aria-current={current ? 'step' : undefined}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

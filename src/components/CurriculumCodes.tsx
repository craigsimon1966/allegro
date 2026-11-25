import { curriculumRows, type CurriculumRefs } from '@shared/curriculum';

// Curriculum codes with their official wording. Every code shown here has passed the checks in
// shared/curriculum.ts: it is in the ACARA or NESA list, and it belongs to the teacher's year
// (or NSW stage). Tap or hover a code to read what it says. Nothing shows when none pass.

export function CurriculumCodes({
  refs,
  state,
  years,
  className = '',
  compact = false,
}: {
  refs: CurriculumRefs;
  state: string | null | undefined;
  years: string[] | null;
  className?: string;
  /** One short line, for lists such as the week. */
  compact?: boolean;
}) {
  const rows = curriculumRows(refs, state, years);
  if (!rows.length) return null;
  return (
    <dl
      className={`grid max-w-prose grid-cols-[auto_1fr] gap-x-3 ${compact ? 'text-[13px]' : 'text-[15px]'} ${className}`}
      data-testid="curriculum-codes"
    >
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className={compact ? 'text-muted' : 'font-bold'}>{r.label}</dt>
          <dd className="flex flex-wrap gap-x-3">
            {r.codes.map((c) => (
              <details key={c.code} className="group">
                <summary
                  className="cursor-pointer list-none font-bold text-plum-700 underline decoration-dotted underline-offset-2 [&::-webkit-details-marker]:hidden"
                  title={`${c.level}: ${c.text}`}
                >
                  {c.code}
                </summary>
                <span className="block max-w-prose border-l-2 border-plum-500 py-1 pl-2 text-[14px] font-normal text-ink">
                  {c.level}: {c.text}
                </span>
              </details>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

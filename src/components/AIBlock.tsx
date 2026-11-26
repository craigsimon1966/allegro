import { useId, type ReactNode } from 'react';
import { RefreshCw, Pencil } from 'lucide-react';

export const AI_DISCLOSURE = 'Drafted by Allegro AI. Please check before using.';

interface Props {
  children: ReactNode;
  /** "AI DRAFT" for drafts the teacher should check; "AI" for short AI answers. */
  label?: 'AI DRAFT' | 'AI';
  title?: ReactNode;
  onRegenerate?: () => void;
  onEdit?: () => void;
  /** When set, shows the "Check this for accuracy" step until the teacher ticks it. */
  mathsChecked?: boolean;
  onMathsCheckedChange?: (checked: boolean) => void;
  /** Heading level for the title, so the page outline stays in order. */
  headingLevel?: 2 | 3;
}

/**
 * Full-width Plum 100 band for AI content (SPEC 10.1: plum is the thinking colour).
 * Always carries the label and the disclosure line.
 */
export function AIBlock({
  children,
  label = 'AI DRAFT',
  title,
  onRegenerate,
  onEdit,
  mathsChecked,
  onMathsCheckedChange,
  headingLevel = 3,
}: Props) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const checkId = useId();
  const needsCheck = mathsChecked !== undefined;
  return (
    <section
      className="border-y border-margin bg-plum-100 px-3 py-2.5"
      aria-label={`${label}: ${typeof title === 'string' ? title : 'AI content'}`}
    >
      <div className="text-[13px] font-bold tracking-[0.1em] text-plum-700">{label}</div>
      {title && <H className="mt-1 text-lg text-ink">{title}</H>}
      <div className="mt-2 text-ink">{children}</div>
      <p className="mt-2 text-sm text-plum-700">{AI_DISCLOSURE}</p>
      {needsCheck && (
        <div
          className={`mt-2 flex min-h-tap items-center gap-2 ${mathsChecked ? 'text-green-700' : 'text-ink'}`}
        >
          <input
            id={checkId}
            type="checkbox"
            className="h-5 w-5 accent-green-700"
            checked={mathsChecked}
            onChange={(e) => onMathsCheckedChange?.(e.target.checked)}
          />
          <label htmlFor={checkId} className="font-bold">
            {mathsChecked ? 'Checked for accuracy' : 'Check this for accuracy'}
          </label>
        </div>
      )}
      {(onRegenerate || onEdit) && (
        <div className="mt-2 flex gap-4">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-tap items-center gap-1.5 font-bold text-plum-700 underline"
            >
              <Pencil size={18} strokeWidth={1.5} aria-hidden="true" /> Edit
            </button>
          )}
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex min-h-tap items-center gap-1.5 font-bold text-plum-700 underline"
            >
              <RefreshCw size={18} strokeWidth={1.5} aria-hidden="true" /> Regenerate
            </button>
          )}
        </div>
      )}
    </section>
  );
}

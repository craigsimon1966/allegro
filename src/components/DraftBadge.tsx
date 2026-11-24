import { FilePen } from 'lucide-react';

/** Shown on any content unit with reviewedBy: null (TECH_SPEC 9.3). */
export function DraftBadge({ reviewedBy }: { reviewedBy: string | null }) {
  if (reviewedBy) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded border-2 border-warning px-2 py-0.5 text-[13px] font-bold text-ink">
      <FilePen size={16} strokeWidth={1.5} className="text-warning" aria-hidden="true" />
      Draft content, not yet reviewed
    </span>
  );
}

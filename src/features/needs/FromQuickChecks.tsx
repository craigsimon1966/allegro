import { Link } from 'react-router-dom';
import { SectionRule } from '@/components/Label';
import { MathText } from '@/components/MathText';
import { unitById } from '@shared/catalogue';
import { OUTCOME_LABELS, needsSupport } from '@shared/quickCheck';
import { tagById } from '@shared/tags';
import { useAppStore, type TeacherNeed } from '@/lib/store';

/**
 * Skills a quick check flagged (a wrong answer that a follow-up question didn't fix), so they can
 * come back as needs. Nothing shows until a quick check flags something.
 */
export function FromQuickChecks({
  usedTags,
  onAdd,
}: {
  usedTags: Set<string>;
  onAdd: (need: TeacherNeed) => void;
}) {
  const progress = useAppStore((s) => s.progress);
  const flagged = Object.entries(progress).flatMap(([unitId, p]) => {
    const unit = unitById(unitId);
    if (!unit) return [];
    return Object.values(p.attempts ?? {})
      .filter((a) => needsSupport(a.outcome))
      .map((a) => ({ unit, attempt: a, tag: unit.tags.map(tagById).find(Boolean) }));
  });
  if (!flagged.length) return null;

  return (
    <div className="mt-6">
      <SectionRule id="quick-checks-heading">From your quick checks</SectionRule>
      <p className="mt-2 text-[15px] text-muted">
        These questions didn&apos;t come right after a follow-up. Add them to your needs and Allegro
        will bring them back in your week.
      </p>
      <ul aria-labelledby="quick-checks-heading" className="mt-1">
        {flagged.map(({ unit, attempt, tag }) => {
          const onList = unit.tags.some((t) => usedTags.has(t));
          return (
            <li key={attempt.itemId} className="border-b border-rule py-3">
              <p className="text-[13px] uppercase tracking-[0.12em] text-muted">
                {OUTCOME_LABELS[attempt.outcome]}
              </p>
              <h3 className="text-[19px] font-bold">
                <MathText inline>{unit.title}</MathText>
              </h3>
              <div className="mt-1 flex flex-wrap gap-x-5">
                <Link
                  to={`/learn/${unit.id}`}
                  className="inline-flex min-h-tap items-center font-bold text-green-700 underline"
                >
                  Go over it again
                </Link>
                {onList ? (
                  <span className="inline-flex min-h-tap items-center text-[15px] text-muted">
                    Already in your needs
                  </span>
                ) : (
                  tag && (
                    <button
                      type="button"
                      className="inline-flex min-h-tap items-center font-bold text-green-700 underline"
                      onClick={() =>
                        onAdd({
                          id: `quickcheck-${tag.id}-${Date.now()}`,
                          domain: tag.domain,
                          topic: tag.label,
                          catalogue_tags: [tag.id],
                          evidence: `Your quick check in "${unit.title}" showed this is worth another look.`,
                          priority: 'now',
                          status: 'active',
                          selfRating: null,
                          diagnosticResult: null,
                        })
                      }
                    >
                      Add to my needs
                    </button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

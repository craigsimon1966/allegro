import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { MathText } from '@/components/MathText';
import {
  loadPilotYears,
  loadRecentEvents,
  refreshContentReviews,
  type PilotYears,
  type ReviewEvent,
} from '@/lib/contentReview';
import {
  KIND_LABELS,
  matchesFilter,
  progressOf,
  REVIEW_KINDS,
  type ReviewFilter,
  type ReviewKind,
} from '@shared/review';
import { PLAN_YEARS, yearLabel, yearsLabel } from '@shared/curriculum';
import { STATES } from '@shared/states';
import {
  DEFAULT_FILTER,
  formatWhen,
  loadFilter,
  ReviewGate,
  saveFilter,
  StatusMark,
  Toggle,
  useItemsWithStatus,
  useReviewAccess,
} from './reviewCommon';

// /review: the reviewer's queue (replaces the Word review document, 27 Nov 2026).
// Filter by kind, year level, state and status; see overall progress and recent activity.

const ACTIONS: Record<ReviewEvent['action'], string> = {
  approved: 'approved',
  flagged: 'flagged',
  edited: 'edited',
  commented: 'commented on',
  reopened: 'reopened',
};

export default function ReviewQueue() {
  const access = useReviewAccess();
  return (
    <ReviewGate access={access} path="/review">
      {(role) => <Queue isAdmin={role.isAdmin} />}
    </ReviewGate>
  );
}

function ProgressBar({
  approved,
  flagged,
  total,
}: {
  approved: number;
  flagged: number;
  total: number;
}) {
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  return (
    <div
      className="mt-2 flex h-3 w-full overflow-hidden rounded border border-ink"
      aria-hidden="true"
    >
      <div className="bg-green-700" style={{ width: `${pct(approved)}%` }} />
      <div className="bg-error" style={{ width: `${pct(flagged)}%` }} />
    </div>
  );
}

function Queue({ isAdmin }: { isAdmin: boolean }) {
  const all = useItemsWithStatus();
  const [filter, setFilterState] = useState<ReviewFilter>(() => loadFilter() ?? DEFAULT_FILTER);
  const [pilot, setPilot] = useState<PilotYears | null>(null);
  const [recent, setRecent] = useState<ReviewEvent[]>([]);

  useEffect(() => {
    void refreshContentReviews();
    void loadRecentEvents(8).then(setRecent);
    void loadPilotYears().then((p) => {
      setPilot(p);
      // First visit: start with the years (and state) the pilot teachers teach.
      if (!loadFilter() && p.years.length) {
        const f = {
          ...DEFAULT_FILTER,
          years: p.years.map((y) => y.value),
          state: p.states.length === 1 ? p.states[0]!.value : null,
        };
        setFilterState(f);
        saveFilter(f);
      }
    });
  }, []);

  const setFilter = (f: ReviewFilter) => {
    setFilterState(f);
    saveFilter(f);
  };
  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const shown = useMemo(
    () => all.filter((x) => matchesFilter(x.item, x.status, filter)),
    [all, filter],
  );
  const inScope = useMemo(
    () =>
      all.filter((x) => matchesFilter(x.item, x.status, { ...filter, status: 'all', search: '' })),
    [all, filter],
  );
  const overall = progressOf(all.map((x) => x.status));
  const scoped = progressOf(inScope.map((x) => x.status));
  const byKind = REVIEW_KINDS.map((k) => ({
    kind: k,
    ...progressOf(all.filter((x) => x.item.kind === k).map((x) => x.status)),
  }));
  const pilotYears = pilot?.years.map((y) => y.value) ?? [];
  const usingPilot =
    pilotYears.length > 0 &&
    pilotYears.length === filter.years.length &&
    pilotYears.every((y) => filter.years.includes(y));

  return (
    <>
      <SiteHeader />
      <main id="main">
        <MarginLayout className="lg:mx-auto lg:max-w-[960px]">
          <Label>Content review</Label>
          <h1 className="mt-1 text-[30px] leading-tight">Review queue</h1>
          <p className="mt-2 max-w-prose">
            Open an item to approve it, edit it or flag it with a comment. Approved items lose their
            Draft label for every teacher straight away.
          </p>
          {isAdmin && (
            <p className="mt-2">
              <Link className="font-bold text-green-700 underline" to="/review/reviewers">
                Manage reviewers
              </Link>
            </p>
          )}

          <section className="mt-6" aria-labelledby="progress-h">
            <SectionRule id="progress-h">Progress</SectionRule>
            <p className="mt-2 text-[17px]">
              <strong>
                {overall.approved} of {overall.total}
              </strong>{' '}
              approved, {overall.flagged} flagged, {overall.todo} to review.
            </p>
            <ProgressBar {...overall} />
            <table className="mt-3 w-full text-left text-[15px]">
              <caption className="sr-only">Progress by type</caption>
              <thead>
                <tr className="border-b-2 border-rule-strong">
                  <th scope="col" className="py-1.5">
                    Type
                  </th>
                  <th scope="col" className="py-1.5 text-right">
                    Approved
                  </th>
                  <th scope="col" className="py-1.5 text-right">
                    Flagged
                  </th>
                  <th scope="col" className="py-1.5 text-right">
                    To review
                  </th>
                </tr>
              </thead>
              <tbody>
                {byKind.map((k) => (
                  <tr key={k.kind} className="border-b border-rule">
                    <td className="py-1.5">{KIND_LABELS[k.kind].many}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {k.approved} of {k.total}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{k.flagged}</td>
                    <td className="py-1.5 text-right tabular-nums">{k.todo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-8" aria-labelledby="filter-h">
            <SectionRule id="filter-h">Filter</SectionRule>

            {pilotYears.length > 0 && (
              <p className="mt-3 text-[15px]">
                Pilot teachers teach {yearsLabel(pilotYears)}
                {pilot?.states.length
                  ? ` in ${pilot.states.map((s) => s.value).join(', ')}`
                  : ''}.{' '}
                {usingPilot ? (
                  <span className="text-muted">Showing those years.</span>
                ) : (
                  <button
                    type="button"
                    className="font-bold text-green-700 underline"
                    onClick={() => setFilter({ ...filter, years: pilotYears })}
                  >
                    Show those years
                  </button>
                )}
              </p>
            )}

            <fieldset className="mt-3">
              <legend className="mb-1.5 text-[15px] font-bold">Show</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['todo', 'To review'],
                    ['flagged', 'Flagged'],
                    ['approved', 'Approved'],
                    ['all', 'Everything'],
                  ] as const
                ).map(([v, label]) => (
                  <Toggle
                    key={v}
                    pressed={filter.status === v}
                    onClick={() => setFilter({ ...filter, status: v })}
                  >
                    {label}
                  </Toggle>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="mb-1.5 text-[15px] font-bold">Type</legend>
              <div className="flex flex-wrap gap-2">
                {REVIEW_KINDS.map((k: ReviewKind) => (
                  <Toggle
                    key={k}
                    pressed={filter.kinds.includes(k)}
                    onClick={() => setFilter({ ...filter, kinds: toggle(filter.kinds, k) })}
                  >
                    {KIND_LABELS[k].many}
                  </Toggle>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="mb-1.5 text-[15px] font-bold">
                Year levels <span className="font-normal text-muted">(none chosen shows all)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {PLAN_YEARS.map((y) => (
                  <Toggle
                    key={y}
                    pressed={filter.years.includes(y)}
                    onClick={() => setFilter({ ...filter, years: toggle(filter.years, y) })}
                  >
                    <span aria-label={yearLabel(y)}>{y}</span>
                  </Toggle>
                ))}
              </div>
            </fieldset>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="review-state" className="mb-1.5 block text-[15px] font-bold">
                  State or territory
                </label>
                <select
                  id="review-state"
                  value={filter.state ?? ''}
                  onChange={(e) => setFilter({ ...filter, state: e.target.value || null })}
                  className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
                >
                  <option value="">All states</option>
                  {STATES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="review-search" className="mb-1.5 block text-[15px] font-bold">
                  Search
                </label>
                <input
                  id="review-search"
                  type="search"
                  value={filter.search ?? ''}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
                />
              </div>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="items-h">
            <SectionRule id="items-h">
              {shown.length} {shown.length === 1 ? 'item' : 'items'}
            </SectionRule>
            {inScope.length !== all.length && (
              <p className="mt-2 text-[15px] text-muted">
                In these years and state: {scoped.approved} of {scoped.total} approved,{' '}
                {scoped.flagged} flagged.
              </p>
            )}
            <ul className="mt-1" data-testid="review-list">
              {shown.map(({ item, row, status }) => (
                <li key={`${item.kind}:${item.id}`} className="border-b border-rule">
                  <Link
                    to={`/review/${item.kind}/${encodeURIComponent(item.id)}`}
                    className="block py-3 text-ink no-underline hover:bg-sage-100"
                  >
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[13px] uppercase tracking-[0.12em] text-muted">
                        {KIND_LABELS[item.kind].one}
                      </span>
                      <StatusMark status={status} />
                    </span>
                    <span className="mt-1 block text-[17px] font-bold">
                      <MathText inline>{item.title}</MathText>
                    </span>
                    <span className="mt-0.5 block text-[14px] text-muted">
                      {item.area}
                      {item.yearLevels.length ? `, ${yearsLabel(item.yearLevels)}` : ', all years'}
                      {row?.reviewed_by_name && row.reviewed_at
                        ? `. ${status === 'flagged' ? 'Flagged' : 'Reviewed'} by ${row.reviewed_by_name}, ${formatWhen(row.reviewed_at)}`
                        : ''}
                    </span>
                  </Link>
                </li>
              ))}
              {!shown.length && (
                <li className="py-3 text-muted">
                  Nothing here with these filters.{' '}
                  {filter.status === 'todo' && 'Everything in these years has been reviewed.'}
                </li>
              )}
            </ul>
          </section>

          {recent.length > 0 && (
            <section className="mt-8" aria-labelledby="recent-h">
              <SectionRule id="recent-h">Recent activity</SectionRule>
              <ul className="mt-1 text-[15px]">
                {recent.map((e) => {
                  const it = all.find(
                    (x) => x.item.kind === e.item_kind && x.item.id === e.item_id,
                  );
                  return (
                    <li key={e.id} className="border-b border-rule py-2">
                      {e.actor_name} {ACTIONS[e.action]}{' '}
                      <Link
                        className="font-bold text-green-700 underline"
                        to={`/review/${e.item_kind}/${encodeURIComponent(e.item_id)}`}
                      >
                        <MathText inline>{it?.item.title ?? e.item_id}</MathText>
                      </Link>
                      <span className="text-muted">, {formatWhen(e.created_at)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </MarginLayout>
      </main>
    </>
  );
}

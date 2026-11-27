import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { Button } from '@/components/Button';
import { MathText } from '@/components/MathText';
import {
  loadItemEvents,
  refreshContentReviews,
  reviewItem,
  type ReviewAction,
  type ReviewEvent,
} from '@/lib/contentReview';
import {
  applyEdits,
  contentHash,
  diffEdits,
  editableFields,
  editProblems,
  getPath,
  KIND_LABELS,
  matchesFilter,
  type EditableField,
  type ReviewEdits,
  type ReviewItem,
} from '@shared/review';
import { curriculumRows, yearsLabel, type CurriculumRefs } from '@shared/curriculum';
import { BASE_MISCONCEPTIONS } from '@shared/catalogue';
import { STATES } from '@shared/states';
import type { CheckItem, MicroUnit } from '@shared/types';
import {
  DEFAULT_FILTER,
  formatWhen,
  loadFilter,
  ReviewGate,
  StatusMark,
  useItemsWithStatus,
  useReviewAccess,
  type ItemWithStatus,
} from './reviewCommon';

// /review/:kind/:id: one item. Approve, edit or flag it, see who did what and when, and the
// full edit history. Edits go on top of the file in the repo and need approving again.

export default function ReviewItemPage() {
  const { kind = '', id = '' } = useParams();
  const access = useReviewAccess();
  return (
    <ReviewGate access={access} path={`/review/${kind}/${encodeURIComponent(id)}`}>
      {() => <ItemScreen kind={kind} id={id} />}
    </ReviewGate>
  );
}

const toText = (v: unknown, f: EditableField) =>
  f.type === 'lines' ? ((v as string[] | undefined) ?? []).join('\n') : ((v as string) ?? '');
const fromText = (s: string, f: EditableField): string | string[] =>
  f.type === 'lines'
    ? s
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    : s;

/** Every state's codes, one row per curriculum, so a reviewer sees them all in one place. */
function codeRows(refs: CurriculumRefs, state: string | null) {
  const rows = new Map<string, ReturnType<typeof curriculumRows>[number]>();
  const states = state ? [state] : STATES.map((s) => s.id);
  for (const s of states) for (const r of curriculumRows(refs, s, null)) rows.set(r.label, r);
  return [...rows.values()];
}

function Codes({ refs, state }: { refs: CurriculumRefs | undefined; state: string | null }) {
  const rows = refs ? codeRows(refs, state) : [];
  if (!rows.length)
    return <p className="mt-2 text-muted">No curriculum codes (a teaching approach).</p>;
  return (
    <dl className="mt-2 text-[15px]">
      {rows.map((r) => (
        <div key={r.label} className="border-b border-rule py-2">
          <dt className="font-bold">{r.label}</dt>
          <dd>
            <ul>
              {r.codes.map((c) => (
                <li key={c.code} className="mt-1">
                  <span className="font-bold text-plum-700">{c.code}</span>{' '}
                  <span className="text-muted">({c.level})</span> {c.text}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ExtraUnitDetail({ unit }: { unit: MicroUnit }) {
  const mis = unit.misconceptionIds
    .map((m) => BASE_MISCONCEPTIONS.find((x) => x.id === m))
    .filter(Boolean);
  const qs = unit.checkItems as CheckItem[];
  return (
    <details className="mt-4 border-t border-rule pt-3">
      <summary className="min-h-tap cursor-pointer font-bold text-green-700">
        Also in this unit: wrong-answer feedback, parallel questions, misconceptions
      </summary>
      <p className="mt-2 text-[15px] text-muted">
        These are shown for checking. If one needs changing, flag the unit or add a comment saying
        what to change.
      </p>
      {qs.map((q, i) => (
        <div key={q.id} className="mt-3">
          <h4 className="font-bold">Quick check {i + 1}</h4>
          {(q.wrongAnswers ?? []).map((w) => (
            <div key={w.answer} className="mt-2 border-l-2 border-rule pl-3 text-[15px]">
              <p>
                <strong>If they answer</strong> <MathText inline>{w.answer}</MathText>
              </p>
              <MathText>{w.feedback}</MathText>
            </div>
          ))}
          {(q.parallels ?? []).map((p, j) => (
            <div key={p.id} className="mt-2 border-l-2 border-plum-500 pl-3 text-[15px]">
              <p className="font-bold">Parallel question {j + 1}</p>
              <MathText>{p.stemMd}</MathText>
              {p.options && <p>Options: {p.options.join(' | ')}</p>}
              <p>
                Answer: <MathText inline>{p.answer}</MathText>
              </p>
              <MathText>{p.workedSolutionMd}</MathText>
            </div>
          ))}
        </div>
      ))}
      {mis.length > 0 && (
        <p className="mt-3 text-[15px]">
          Linked misconceptions (reviewed separately):{' '}
          {mis.map((m, i) => (
            <span key={m!.id}>
              {i > 0 && ', '}
              <Link
                className="font-bold text-green-700 underline"
                to={`/review/misconception/${m!.id}`}
              >
                {m!.studentSays}
              </Link>
            </span>
          ))}
        </p>
      )}
    </details>
  );
}

const ACTION_WORDS: Record<ReviewEvent['action'], string> = {
  approved: 'Approved',
  flagged: 'Flagged',
  edited: 'Edited',
  commented: 'Commented',
  reopened: 'Reopened',
};

function History({ events, item }: { events: ReviewEvent[]; item: ReviewItem }) {
  const fields = editableFields(item);
  const labelFor = (path: string) => fields.find((f) => f.path === path)?.label ?? path;
  const show = (v: unknown) => (Array.isArray(v) ? v.join(' | ') : String(v ?? ''));
  if (!events.length) return <p className="mt-2 text-muted">Nobody has reviewed this yet.</p>;
  return (
    <ol className="mt-1" data-testid="review-history">
      {events.map((e) => {
        const before = e.before_edits ?? {};
        const after = e.after_edits ?? {};
        const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
          (p) => JSON.stringify(before[p]) !== JSON.stringify(after[p]),
        );
        return (
          <li key={e.id} className="border-b border-rule py-2 text-[15px]">
            <p>
              <strong>{ACTION_WORDS[e.action]}</strong> by {e.actor_name},{' '}
              <span className="text-muted">{formatWhen(e.created_at)}</span>
            </p>
            {e.comment && <p className="mt-1 whitespace-pre-wrap">{e.comment}</p>}
            {e.action === 'edited' && changed.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-green-700">
                  {changed.length} {changed.length === 1 ? 'field' : 'fields'} changed
                </summary>
                {changed.map((p) => (
                  <div key={p} className="mt-2">
                    <p className="font-bold">{labelFor(p)}</p>
                    <p className="text-muted">
                      Before: {show(p in before ? before[p] : getPath(item.base, p))}
                    </p>
                    <p>After: {show(p in after ? after[p] : getPath(item.base, p))}</p>
                  </div>
                ))}
              </details>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ItemScreen({ kind, id }: { kind: string; id: string }) {
  const navigate = useNavigate();
  const all = useItemsWithStatus();
  const [filter] = useState(() => loadFilter() ?? DEFAULT_FILTER);
  const entry: ItemWithStatus | undefined = all.find(
    (x) => x.item.kind === kind && x.item.id === id,
  );
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string[]>([]);
  const [done, setDone] = useState('');

  const loadEvents = useCallback(() => {
    if (entry) void loadItemEvents(entry.item.kind, entry.item.id).then(setEvents);
  }, [entry?.item.kind, entry?.item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refreshContentReviews();
    setEditing(false);
    setComment('');
    setProblem([]);
    setDone('');
  }, [kind, id]);
  useEffect(loadEvents, [loadEvents]);

  // Prev and next within the queue's filter (status ignored, so the list doesn't shift
  // under the reviewer as they approve).
  const queue = useMemo(
    () => all.filter((x) => matchesFilter(x.item, x.status, { ...filter, status: 'all' })),
    [all, filter],
  );
  const at = queue.findIndex((x) => x.item.kind === kind && x.item.id === id);
  const nextTodo =
    queue.slice(at + 1).find((x) => x.status === 'draft' || x.status === 'changed') ??
    queue.slice(0, Math.max(at, 0)).find((x) => x.status === 'draft' || x.status === 'changed');
  const go = (x: ItemWithStatus | undefined) =>
    x && navigate(`/review/${x.item.kind}/${encodeURIComponent(x.item.id)}`);

  if (!entry)
    return (
      <>
        <SiteHeader />
        <main id="main">
          <MarginLayout>
            <h1 className="text-[30px]">Item not found</h1>
            <p className="mt-3">
              <Link className="font-bold text-green-700 underline" to="/review">
                Back to the review queue
              </Link>
            </p>
          </MarginLayout>
        </main>
      </>
    );

  const { item, row, status } = entry;
  const fields = editableFields(item);
  const current = applyEdits(item.base, row?.edits) as Record<string, unknown>;
  const refs = (
    item.kind === 'unit'
      ? (current as unknown as MicroUnit).curriculumRefs
      : item.kind === 'topic'
        ? (current.curriculum as CurriculumRefs)
        : undefined
  ) as CurriculumRefs | undefined;

  const startEdit = () => {
    setValues(Object.fromEntries(fields.map((f) => [f.path, toText(getPath(current, f.path), f)])));
    setEditing(true);
    setProblem([]);
    setDone('');
  };

  const act = async (action: ReviewAction, extra: { edits?: ReviewEdits } = {}) => {
    setBusy(true);
    setProblem([]);
    setDone('');
    try {
      await reviewItem({
        kind: item.kind,
        id: item.id,
        action,
        version: row?.version ?? 0,
        comment,
        hash: action === 'approve' ? contentHash(current) : undefined,
        ...extra,
      });
      setComment('');
      setEditing(false);
      setDone(
        {
          approve: 'Approved.',
          flag: 'Flagged. Your comment is saved below.',
          edit: 'Edits saved. Approve the item when it is ready.',
          comment: 'Comment saved.',
          reopen: 'Back in the queue.',
        }[action],
      );
      loadEvents();
    } catch (e) {
      setProblem([(e as Error).message]);
    } finally {
      setBusy(false);
    }
  };

  const saveEdits = () => {
    const typed = Object.fromEntries(
      fields.map((f) => [f.path, fromText(values[f.path] ?? '', f)]),
    );
    // Saved edits are measured against the file, so undoing a change removes it.
    const edits = diffEdits(item.base, typed);
    const problems = editProblems(item, edits);
    if (problems.length) {
      setProblem(problems);
      return;
    }
    void act('edit', { edits });
  };

  const editedPaths = new Set(Object.keys(row?.edits ?? {}));

  return (
    <>
      <SiteHeader />
      <main id="main">
        <MarginLayout className="lg:mx-auto lg:max-w-[960px]">
          <p>
            <Link className="font-bold text-green-700 underline" to="/review">
              Back to the review queue
            </Link>
          </p>
          <Label className="mt-4">{KIND_LABELS[item.kind].one}</Label>
          <h1 className="mt-1 text-[28px] leading-tight">
            <MathText inline>{item.kind === 'unit' ? String(current.title) : item.title}</MathText>
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {item.area}
            {item.yearLevels.length ? `, ${yearsLabel(item.yearLevels)}` : ', all years'}
            {item.states ? `, ${item.states.join(', ')}` : ''}. <code>{item.id}</code>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusMark status={status} />
            {row?.reviewed_by_name && row.reviewed_at && status !== 'draft' && (
              <span className="text-[15px]">
                {status === 'flagged' ? 'Flagged' : 'Approved'} by {row.reviewed_by_name},{' '}
                {formatWhen(row.reviewed_at)}
              </span>
            )}
            {status === 'changed' && (
              <span className="text-[15px]">
                The content changed after it was approved, so it needs approving again.
              </span>
            )}
            {editedPaths.size > 0 && (
              <span className="text-[15px] text-muted">
                Includes reviewer edits ({editedPaths.size}{' '}
                {editedPaths.size === 1 ? 'field' : 'fields'}).
              </span>
            )}
          </div>
          {item.kind === 'unit' && (
            <p className="mt-2 text-[15px]">
              <Link
                className="font-bold text-green-700 underline"
                to={`/learn/${item.id}`}
                target="_blank"
                rel="noreferrer"
              >
                See it as a teacher does (opens in a new tab)
              </Link>
            </p>
          )}

          {refs && (
            <section className="mt-6" aria-labelledby="codes-h">
              <SectionRule id="codes-h">
                Curriculum codes{filter.state ? ` (${filter.state})` : ''}
              </SectionRule>
              <p className="mt-2 text-[15px] text-muted">
                Check each code matches what this teaches. Codes come from the official lists only,
                so to change one, flag the item and say which code it should be.
              </p>
              <Codes refs={refs} state={filter.state} />
            </section>
          )}

          {fields.length > 0 && (
            <section className="mt-6" aria-labelledby="content-h">
              <SectionRule id="content-h">Content</SectionRule>
              {!editing ? (
                <>
                  <dl>
                    {fields.map((f) => {
                      const v = getPath(current, f.path);
                      return (
                        <div key={f.path} className="border-b border-rule py-3">
                          <dt className="text-[13px] font-bold uppercase tracking-[0.12em] text-plum-700">
                            {f.label}
                            {editedPaths.has(f.path) && (
                              <span className="ml-2 normal-case tracking-normal text-muted">
                                (edited)
                              </span>
                            )}
                          </dt>
                          <dd className="mt-1">
                            {f.type === 'lines' ? (
                              <ol className="list-[upper-alpha] pl-6">
                                {((v as string[]) ?? []).map((o) => (
                                  <li key={o}>
                                    <MathText inline>{o}</MathText>
                                  </li>
                                ))}
                              </ol>
                            ) : f.type === 'md' ? (
                              <MathText>{String(v ?? '')}</MathText>
                            ) : (
                              <MathText inline>{String(v ?? '')}</MathText>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                  {item.kind === 'unit' && (
                    <ExtraUnitDetail unit={current as unknown as MicroUnit} />
                  )}
                </>
              ) : (
                <div className="mt-3 flex flex-col gap-5">
                  <p className="text-[15px] text-muted">
                    Maths goes between dollar signs, for example $y = 2x + 5$. The preview under
                    each box shows how it will look.
                  </p>
                  {fields.map((f, i) => (
                    <div key={f.path}>
                      <label htmlFor={`field-${i}`} className="mb-1.5 block font-bold">
                        {f.label}
                      </label>
                      {f.type === 'text' ? (
                        <input
                          id={`field-${i}`}
                          value={values[f.path] ?? ''}
                          onChange={(e) => setValues({ ...values, [f.path]: e.target.value })}
                          className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
                        />
                      ) : (
                        <textarea
                          id={`field-${i}`}
                          value={values[f.path] ?? ''}
                          rows={Math.min(
                            14,
                            Math.max(3, (values[f.path] ?? '').split('\n').length + 1),
                          )}
                          onChange={(e) => setValues({ ...values, [f.path]: e.target.value })}
                          className="w-full rounded border-2 border-ink bg-field px-3 py-2 text-[17px] text-ink"
                        />
                      )}
                      {f.type !== 'text' && (values[f.path] ?? '').includes('$') && (
                        <div className="mt-1 border-l-2 border-plum-500 pl-3 text-[15px]">
                          <MathText>
                            {f.type === 'lines'
                              ? (values[f.path] ?? '').split('\n').join('\n\n')
                              : (values[f.path] ?? '')}
                          </MathText>
                        </div>
                      )}
                    </div>
                  ))}
                  <div>
                    <label htmlFor="edit-note" className="mb-1.5 block font-bold">
                      What did you change, and why?{' '}
                      <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <textarea
                      id="edit-note"
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full rounded border-2 border-ink bg-field px-3 py-2 text-[17px] text-ink"
                    />
                  </div>
                  {problem.length > 0 && (
                    <ul role="alert" className="font-bold text-error">
                      {problem.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={saveEdits} disabled={busy}>
                      Save edits
                    </Button>
                    <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {!editing && (
            <section className="mt-8" aria-labelledby="decide-h">
              <SectionRule id="decide-h">Your review</SectionRule>
              <label htmlFor="review-comment" className="mb-1.5 mt-3 block font-bold">
                Comment{' '}
                <span className="font-normal text-muted">
                  (needed to flag, optional to approve)
                </span>
              </label>
              <textarea
                id="review-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded border-2 border-ink bg-field px-3 py-2 text-[17px] text-ink"
              />
              {problem.length > 0 && (
                <p role="alert" className="mt-2 font-bold text-error">
                  {problem[0]}
                </p>
              )}
              {done && (
                <p role="status" className="mt-2 font-bold text-success">
                  {done}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                {status !== 'approved' && (
                  <Button onClick={() => void act('approve')} disabled={busy}>
                    Approve
                  </Button>
                )}
                {fields.length > 0 && (
                  <Button variant="secondary" onClick={startEdit} disabled={busy}>
                    Edit
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() =>
                    comment.trim()
                      ? void act('flag')
                      : setProblem(['Write a comment saying what needs fixing, then flag it.'])
                  }
                  disabled={busy}
                >
                  Flag
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    comment.trim()
                      ? void act('comment')
                      : setProblem(['Please write a comment first.'])
                  }
                  disabled={busy}
                >
                  Add comment
                </Button>
                {status !== 'draft' && (
                  <Button variant="secondary" onClick={() => void act('reopen')} disabled={busy}>
                    Back to draft
                  </Button>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {at > 0 && (
                  <button
                    type="button"
                    className="min-h-tap font-bold text-green-700 underline"
                    onClick={() => go(queue[at - 1])}
                  >
                    Previous item
                  </button>
                )}
                {at >= 0 && at < queue.length - 1 && (
                  <button
                    type="button"
                    className="min-h-tap font-bold text-green-700 underline"
                    onClick={() => go(queue[at + 1])}
                  >
                    Next item
                  </button>
                )}
                {nextTodo && (
                  <button
                    type="button"
                    className="min-h-tap font-bold text-green-700 underline"
                    onClick={() => go(nextTodo)}
                  >
                    Next to review
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="mt-8" aria-labelledby="history-h">
            <SectionRule id="history-h">History</SectionRule>
            <History events={events} item={item} />
          </section>
        </MarginLayout>
      </main>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { AIBlock } from '@/components/AIBlock';
import { Button } from '@/components/Button';
import { MarginLayout } from '@/components/MarginLayout';
import { SectionRule } from '@/components/Label';
import { DOMAIN_LABELS, TAGS, tagById } from '@shared/tags';
import { RESULT_LABELS, itemsForTag } from '@shared/diagnostics';
import { loadLatestFromSupabase, saveNeedEdit } from '@/lib/api';
import { useAppStore, type TeacherNeed } from '@/lib/store';
import type { Need } from '@shared/schemas';
import { DiagnosticCheck } from './DiagnosticCheck';

// "Here's what we heard" (SPEC 7.4).

const PRIORITY_LABEL: Record<Need['priority'], string> = {
  now: 'Now',
  soon: 'Soon',
  later: 'Later',
};
const ORDER: Record<Need['priority'], number> = { now: 0, soon: 1, later: 2 };

export default function Needs() {
  const navigate = useNavigate();
  const mode = useAppStore((s) => s.mode);
  const diagnosis = useAppStore((s) => s.diagnosis);
  const summary = useAppStore((s) => s.summary);
  const setSummary = useAppStore((s) => s.setSummary);
  const needs = useAppStore((s) => s.needs);
  const updateNeed = useAppStore((s) => s.updateNeed);
  const addNeed = useAppStore((s) => s.addNeed);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(summary);
  const [checking, setChecking] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addTag, setAddTag] = useState('');
  // Signed in on a new device: fetch the saved needs before deciding where to go.
  const [loading, setLoading] = useState(mode === 'signed_in' && !diagnosis);
  useEffect(() => {
    if (!loading) return;
    void loadLatestFromSupabase()
      .catch(() => false)
      .finally(() => setLoading(false));
  }, [loading]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <p>Loading your needs</p>
      </div>
    );

  if (mode === 'anonymous' || !diagnosis)
    return <Navigate to={mode === 'anonymous' ? '/demo' : '/start'} replace />;

  const patch = (n: TeacherNeed, p: Partial<TeacherNeed>) => {
    updateNeed(n.id, p);
    void saveNeedEdit({ ...n, ...p }).catch(() => undefined);
  };

  const active = needs
    .filter((n) => n.status === 'active')
    .sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
  const removed = needs.filter((n) => n.status === 'removed');
  const usedTags = new Set(
    needs.filter((n) => n.status === 'active').flatMap((n) => n.catalogue_tags),
  );
  const addable = TAGS.filter((t) => !usedTags.has(t.id));
  const wellbeing = diagnosis.safety_flags.includes('wellbeing_concern');

  const add = () => {
    const t = tagById(addTag);
    if (!t) return;
    addNeed({
      id: `added-${t.id}-${Date.now()}`,
      domain: t.domain,
      topic: t.label,
      catalogue_tags: [t.id],
      evidence: 'You added this.',
      priority: 'soon',
      status: 'active',
      selfRating: null,
      diagnosticResult: null,
    });
    setAdding(false);
    setAddTag('');
  };

  return (
    <AppShell step={2} setup backTo="/start">
      <MarginLayout>
        <h1 className="text-[30px] leading-tight">Here&apos;s what we heard</h1>

        <div className="mt-4">
          <AIBlock
            label="AI"
            title="Your situation"
            headingLevel={2}
            onEdit={
              editing
                ? undefined
                : () => {
                    setDraft(summary);
                    setEditing(true);
                  }
            }
          >
            {editing ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="summary-edit" className="sr-only">
                  Edit the summary
                </label>
                <textarea
                  id="summary-edit"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  className="w-full rounded border-2 border-ink bg-field p-2 text-[17px] text-ink"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setSummary(draft.trim() || summary);
                      setEditing(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p>{summary}</p>
            )}
          </AIBlock>
        </div>

        {wellbeing && (
          <div className="mt-4 border-l-4 border-info py-2 pl-3">
            <p className="font-bold">It sounds like this term has been a lot.</p>
            <p>
              If things feel heavy, your school&apos;s Employee Assistance Program is free and
              confidential. You can also call Beyond Blue on 1300 22 4636, any time.
            </p>
          </div>
        )}

        <div className="mt-6">
          <SectionRule id="needs-heading">What you need, in order</SectionRule>
          <p className="mt-2 text-[15px] text-muted">
            Change the order, rate your confidence, or remove anything that doesn&apos;t fit.
          </p>
          <ul aria-labelledby="needs-heading" className="mt-1">
            {active.map((n, idx) => {
              const ckTag =
                n.domain === 'CK'
                  ? n.catalogue_tags.find((t) => itemsForTag(t).length > 0)
                  : undefined;
              return (
                <li key={n.id} className="flex border-b border-rule">
                  <div className="w-margin shrink-0 pt-3 text-center font-heading text-[22px] font-semibold text-green-700">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1 py-3 pl-4 pr-2">
                    <p className="text-[13px] uppercase tracking-[0.12em] text-muted">
                      {DOMAIN_LABELS[n.domain]}
                    </p>
                    <h3 className="text-[19px] font-bold">{n.topic}</h3>
                    <p className="mt-0.5 text-[15px] text-muted">{n.evidence}</p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`conf-${n.id}`} className="block text-[15px] font-bold">
                          How confident are you?{' '}
                          {n.selfRating ? `${n.selfRating} of 5` : 'Not rated'}
                        </label>
                        <input
                          id={`conf-${n.id}`}
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={n.selfRating ?? 3}
                          aria-valuetext={n.selfRating ? `${n.selfRating} of 5` : 'Not rated'}
                          onChange={(e) => patch(n, { selfRating: Number(e.target.value) })}
                          className="w-full accent-green-700"
                        />
                        <div className="flex justify-between text-[13px] text-muted">
                          <span>Not yet</span>
                          <span>Very</span>
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`prio-${n.id}`} className="block text-[15px] font-bold">
                          When
                        </label>
                        <select
                          id={`prio-${n.id}`}
                          value={n.priority}
                          onChange={(e) =>
                            patch(n, { priority: e.target.value as Need['priority'] })
                          }
                          className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
                        >
                          {(['now', 'soon', 'later'] as const).map((p) => (
                            <option key={p} value={p}>
                              {PRIORITY_LABEL[p]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {n.diagnosticResult && checking !== n.id && (
                      <p className="mt-2 font-bold text-green-700">
                        Check: {RESULT_LABELS[n.diagnosticResult]}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-x-5">
                      {ckTag && checking !== n.id && (
                        <button
                          type="button"
                          onClick={() => setChecking(n.id)}
                          className="min-h-tap font-bold text-green-700 underline"
                        >
                          Check yourself · 2 min
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => patch(n, { status: 'removed' })}
                        className="min-h-tap text-muted underline"
                        aria-label={`Remove ${n.topic}`}
                      >
                        Remove
                      </button>
                    </div>

                    {ckTag && checking === n.id && (
                      <DiagnosticCheck
                        tag={ckTag}
                        topic={n.topic}
                        selfRating={n.selfRating}
                        onDone={(r) => patch(n, { diagnosticResult: r })}
                        onClose={() => setChecking(null)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {removed.length > 0 && (
            <div className="mt-3 text-[15px] text-muted">
              Removed:{' '}
              {removed.map((n, i) => (
                <span key={n.id}>
                  {i > 0 && ', '}
                  {n.topic}{' '}
                  <button
                    type="button"
                    className="min-h-tap font-bold text-green-700 underline"
                    onClick={() => patch(n, { status: 'active' })}
                  >
                    Undo
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-4">
            {adding ? (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[16rem] flex-1">
                  <label htmlFor="add-need" className="block text-[15px] font-bold">
                    What did we miss?
                  </label>
                  <select
                    id="add-need"
                    value={addTag}
                    onChange={(e) => setAddTag(e.target.value)}
                    className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
                  >
                    <option value="">Choose a topic</option>
                    {addable.map((t) => (
                      <option key={t.id} value={t.id}>
                        {DOMAIN_LABELS[t.domain]}: {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={add} disabled={!addTag}>
                  Add
                </Button>
                <Button variant="secondary" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="min-h-tap font-bold text-green-700 underline"
              >
                + Add something we missed
              </button>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={() => navigate('/pathway')} disabled={active.length === 0}>
            Build my week <span aria-hidden="true">→</span>
          </Button>
        </div>
      </MarginLayout>
    </AppShell>
  );
}

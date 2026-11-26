import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { sourcesFor } from '@shared/sources';
import { DockedQuickHelp } from '@/components/DockedQuickHelp';
import { Label, SectionRule } from '@/components/Label';
import { Highlight } from '@/components/Highlight';
import { DraftBadge } from '@/components/DraftBadge';
import { MathText } from '@/components/MathText';
import { ButtonLink } from '@/components/Button';
import { UNITS, unitById } from '@shared/catalogue';
import { addDays, buildPathway, sydneyWeekStart, totalMinutes } from '@shared/pathway';
import { DOMAIN_LABELS } from '@shared/tags';
import { personaById } from '@shared/personas';
import { teacherProfile, ROLE_SHORT } from '@shared/profile';
import { builtForLine } from '@shared/curriculum';
import { CurriculumCodes } from '@/components/CurriculumCodes';
import { aiPathway, loadLatestFromSupabase, loadPathwayFromSupabase, savePathway } from '@/lib/api';
import { useAppStore, type ReadingPick } from '@/lib/store';
import { AIProgress } from '@/components/AIProgress';
import { Thumbs } from '@/features/feedback/Thumbs';

/** Rough typical wait for the AI's week. The call gives up at 45 seconds and uses rules. */
const AI_WEEK_SECONDS = 25;

// This week (SPEC 7.5). Demo personas get the rules version straight away. Everyone else gets the
// AI's choices (checked on the server for hours, days and real units), or rules if the AI fails.

function formatDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y!, m! - 1, d!)));
}

export default function Pathway() {
  const mode = useAppStore((s) => s.mode);
  const diagnosis = useAppStore((s) => s.diagnosis);
  const intake = useAppStore((s) => s.intake);
  const needs = useAppStore((s) => s.needs);
  const pathway = useAppStore((s) => s.pathway);
  const pathwayKey = useAppStore((s) => s.pathwayKey);
  const reading = useAppStore((s) => s.pathwayReading) ?? [];
  const setPathway = useAppStore((s) => s.setPathway);
  const moveItem = useAppStore((s) => s.moveItem);
  const setItemDay = useAppStore((s) => s.setItemDay);
  const progress = useAppStore((s) => s.progress);
  const personaId = useAppStore((s) => s.personaId);
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  // Drag to reorder with a mouse (SPEC 7.5); the up and down buttons stay for touch and keyboard.
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'signed_in' && !diagnosis);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    if (!loading) return;
    void loadLatestFromSupabase()
      .catch(() => false)
      .finally(() => setLoading(false));
  }, [loading]);

  const active = needs.filter((n) => n.status === 'active');
  const hours = intake?.guided.hoursPerWeek ?? diagnosis?.context.hours_per_week ?? 2;
  const weekStart = sydneyWeekStart();
  // What the teacher told us about themselves wins over what the AI read into their words.
  const profile = teacherProfile(intake?.guided, diagnosis);
  const teachingDaysPerWeek = profile.daysPerWeek;
  const pathwayNeeds = active.map((n) => ({
    id: n.id,
    topic: n.topic,
    evidence: n.evidence,
    priority: n.priority,
    catalogue_tags: n.catalogue_tags,
    concern: n.selfRating,
  }));
  const key = JSON.stringify([
    active.map((n) => [n.id, n.priority, n.catalogue_tags, n.selfRating]),
    hours,
    teachingDaysPerWeek,
    weekStart,
    profile.years,
    profile.newToYears,
  ]);

  // Signed in: try the saved week first, then build a new one if it doesn't match.
  const triedLoad = useRef(mode !== 'signed_in');
  const latestKey = useRef(key);
  latestKey.current = key;
  // The key the AI is building for, so a re-run of the effect doesn't ask twice.
  const aiKey = useRef<string | null>(null);
  useEffect(() => {
    if (!diagnosis || key === pathwayKey) return;
    let cancelled = false;
    const input = {
      needs: pathwayNeeds,
      units: UNITS,
      hoursPerWeek: hours,
      teachingDaysPerWeek,
      weekStart,
      yearLevels: profile.years,
      focusYears: profile.newToYears,
    };
    const finish = (items: ReturnType<typeof buildPathway>, reading: ReadingPick[] = []) => {
      // An AI reply can arrive after a re-run of this effect, so check the key, not `cancelled`.
      if (latestKey.current !== key || useAppStore.getState().pathwayKey === key) return;
      setPathway(items, key, reading);
      void savePathway(items).catch(() => undefined);
    };
    const build = () => {
      if (cancelled || useAppStore.getState().pathwayKey === key) return;
      // Personas are a scripted demo, so they never wait on the AI.
      if (personaId || active.length === 0) return finish(buildPathway(input));
      if (aiKey.current === key) return;
      aiKey.current = key;
      setBuilding(true);
      void aiPathway({
        needs: pathwayNeeds,
        hoursPerWeek: hours,
        teachingDaysPerWeek,
        weekStart,
        yearLevels: profile.years,
        ...(profile.situations.length ? { situations: profile.situations } : {}),
        ...(profile.confidentYears.length ? { confidentYears: profile.confidentYears } : {}),
        ...(profile.newToYears.length ? { newToYears: profile.newToYears } : {}),
        ...(profile.state ? { state: profile.state } : {}),
        ...(profile.role ? { role: profile.role } : {}),
        ...(profile.locationType ? { locationType: profile.locationType } : {}),
      })
        .then((ai) => {
          // The server already checked these; run them through the same rules again here.
          finish(ai ? buildPathway(input, ai.items) : buildPathway(input), ai?.external ?? []);
        })
        .finally(() => {
          if (aiKey.current === key) aiKey.current = null;
          setBuilding(false);
        });
    };
    if (triedLoad.current) build();
    else {
      triedLoad.current = true;
      void loadPathwayFromSupabase(key, weekStart)
        .catch(() => undefined)
        .finally(build);
    }
    return () => {
      cancelled = true;
    };
    // `active` is derived from `needs`, which `key` already covers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pathwayKey, diagnosis]);

  const move = (unitId: string, dir: -1 | 1) => {
    moveItem(unitId, dir);
    void savePathway(useAppStore.getState().pathway ?? []).catch(() => undefined);
  };

  const changeDay = (unitId: string, day: string) => {
    setItemDay(unitId, day);
    void savePathway(useAppStore.getState().pathway ?? []).catch(() => undefined);
  };

  const dropOn = (targetId: string) => {
    const from = items.findIndex((x) => x.unitId === dragId);
    const to = items.findIndex((x) => x.unitId === targetId);
    setDragId(null);
    setOverId(null);
    if (from < 0 || to < 0 || from === to || !dragId) return;
    for (let k = 0; k < Math.abs(to - from); k++) moveItem(dragId, to > from ? 1 : -1);
    void savePathway(useAppStore.getState().pathway ?? []).catch(() => undefined);
  };

  const items = useMemo(
    () => [...(pathway ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [pathway],
  );

  if (building && items.length === 0 && !loading)
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <AIProgress
          title="Building your week"
          steps={[
            'Reading your needs',
            'Choosing units that fit your time',
            'Putting them on your free days',
            'Picking further reading',
          ]}
          expectedSeconds={AI_WEEK_SECONDS}
          slowNote="If it takes more than 45 seconds, we'll build your week from your needs straight away."
        />
      </div>
    );
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <p>Loading your week</p>
      </div>
    );
  if (mode === 'anonymous') return <Navigate to="/demo" replace />;
  if (!diagnosis) return <Navigate to="/start" replace />;

  const budget = Math.round(hours * 60);
  const done = items.filter((it) => progress[it.unitId]?.completedAt);
  const doneMinutes = totalMinutes(done, UNITS);
  const planned = totalMinutes(items, UNITS);
  const todo = items.filter((it) => !progress[it.unitId]?.completedAt);
  const nowNeedIds = new Set(active.filter((n) => n.priority === 'now').map((n) => n.id));
  const urgent = todo.filter((it) => nowNeedIds.has(it.needId)).slice(0, 3);
  const next = todo[0];
  const persona = personaId ? personaById(personaId) : undefined;
  const yearLabel = profile.years.length ? `Year ${profile.years.join(' and ')}` : '';
  const builtFor = builtForLine({
    years: profile.years,
    state: profile.state,
    role: profile.role ? ROLE_SHORT[profile.role] : null,
  });
  // Approved sources for their year levels, with the AI's picks (and reasons) first.
  const forYears = sourcesFor(profile.years, profile.state);
  const picked = new Map(
    reading
      .filter((r) => forYears.some((s) => s.id === r.sourceId))
      .map((r) => [r.sourceId, r.reason]),
  );
  const furtherReading = [...forYears].sort(
    (a, b) => Number(picked.has(b.id)) - Number(picked.has(a.id)),
  );
  const daysOff = teachingDaysPerWeek ? 5 - teachingDaysPerWeek : 0;

  return (
    <AppShell step={3}>
      <div className="lg:flex">
        <MarginLayout className="lg:min-w-0 lg:flex-1">
          <Label>
            Week of {formatDay(weekStart)}
            {persona ? ` · ${persona.name}` : ''}
          </Label>
          <h1 className="mt-1 text-[30px] leading-tight">This week</h1>
          <p className="mt-1 text-muted">
            {doneMinutes} of {planned} minutes done · you have {budget} minutes this week
          </p>
          {builtFor && (
            <p className="mt-1 text-[15px]" data-testid="built-for">
              <span className="font-bold text-plum-700">Built for:</span> {builtFor}
            </p>
          )}

          {items.length === 0 ? (
            <div className="mt-6 max-w-prose">
              <p>
                We don&apos;t have learning units for these needs yet. Try adding another need, or
                ask a question.
              </p>
              <p className="mt-4">
                <Link to="/needs" className="font-bold text-green-700 underline">
                  Back to your needs
                </Link>
              </p>
            </div>
          ) : (
            <>
              {urgent.length > 0 && (
                <section
                  aria-labelledby="before-monday"
                  className="-ml-content mt-6 border-y-2 border-rule-strong bg-sage-100 py-4 pl-content pr-5"
                >
                  <h2 id="before-monday" className="text-[20px] font-semibold">
                    Before your next lesson
                    {yearLabel ? `, ${yearLabel}` : ''}
                  </h2>
                  <p className="mt-1">
                    {urgent.length === 1 ? 'One short unit' : `${urgent.length} short units`} to do
                    first:
                  </p>
                  <ul className="mt-1 list-disc pl-5">
                    {urgent.map((it) => (
                      <li key={it.unitId}>
                        <MathText inline>{unitById(it.unitId)?.title ?? ''}</MathText>
                      </li>
                    ))}
                  </ul>
                  {next && (
                    <ButtonLink to={`/learn/${next.unitId}`} variant="ink" className="mt-3">
                      {done.length ? 'Continue' : 'Start'}:{' '}
                      <MathText inline>{unitById(next.unitId)?.title ?? ''}</MathText>{' '}
                      <span aria-hidden="true">→</span>
                    </ButtonLink>
                  )}
                </section>
              )}

              <div className="mt-8">
                <SectionRule>Your learning this week</SectionRule>
                {items.some((it) => !unitById(it.unitId)?.reviewedBy) && (
                  <div className="mt-3">
                    <DraftBadge reviewedBy={null} />
                    <p className="mt-1 text-[13px] text-muted">
                      These units are drafts until a maths educator has reviewed them.
                    </p>
                  </div>
                )}
                <ol>
                  {items.map((it, i) => {
                    const u = unitById(it.unitId);
                    if (!u) return null;
                    const isDone = Boolean(progress[it.unitId]?.completedAt);
                    const isNext = next?.unitId === it.unitId;
                    return (
                      <li
                        key={it.unitId}
                        draggable
                        onDragStart={(e) => {
                          setDragId(it.unitId);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', it.unitId);
                        }}
                        onDragOver={(e) => {
                          if (!dragId) return;
                          e.preventDefault();
                          setOverId(it.unitId);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          dropOn(it.unitId);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverId(null);
                        }}
                        className={`flex items-start border-b border-rule lg:cursor-grab ${
                          dragId === it.unitId ? 'opacity-50' : ''
                        } ${overId === it.unitId && dragId !== it.unitId ? 'shadow-[inset_0_3px_0_var(--green-700)]' : ''}`}
                      >
                        <div
                          className={`w-margin shrink-0 pt-3 text-center ${
                            isDone
                              ? 'font-margin text-[28px] leading-none text-green-700'
                              : 'font-heading text-[22px] font-semibold text-plum-500'
                          }`}
                        >
                          {isDone ? <span aria-label="Done">✓</span> : i + 1}
                        </div>
                        <div className="min-w-0 flex-1 py-3 pl-4">
                          <Link
                            to={`/learn/${u.id}`}
                            className={`text-[17px] text-ink no-underline hover:underline ${
                              isNext ? 'font-bold' : ''
                            } ${isDone ? 'text-muted line-through decoration-green-700' : ''}`}
                          >
                            {isNext ? (
                              <Highlight>
                                <MathText inline>{u.title}</MathText>
                              </Highlight>
                            ) : (
                              <MathText inline>{u.title}</MathText>
                            )}
                          </Link>
                          <div className="text-[13px] text-muted">
                            {DOMAIN_LABELS[u.domain]} · {u.durationMinutes} min ·{' '}
                            <select
                              aria-label={`Day for ${u.title}`}
                              value={it.scheduledFor}
                              onChange={(e) => changeDay(it.unitId, e.target.value)}
                              className="min-h-[32px] cursor-pointer rounded-none border-0 border-b border-rule bg-transparent text-[13px] text-muted"
                            >
                              {[1, 2, 3, 4, 5].map((d) => {
                                const iso = addDays(weekStart, d - 1);
                                return (
                                  <option key={d} value={iso}>
                                    {formatDay(iso)}
                                  </option>
                                );
                              })}
                            </select>
                            {isNext ? ' · up next' : ''}
                          </div>
                          <CurriculumCodes
                            refs={u.curriculumRefs}
                            state={profile.state}
                            years={profile.years}
                            compact
                            className="mt-1"
                          />
                          <div className="mt-1 flex flex-wrap items-center gap-x-4">
                            <button
                              type="button"
                              className="min-h-tap text-[15px] font-bold text-green-700 underline"
                              aria-expanded={openWhy === it.unitId}
                              onClick={() => setOpenWhy(openWhy === it.unitId ? null : it.unitId)}
                            >
                              Why this?
                            </button>
                            {u.reviewedBy && (
                              <span className="text-[13px] text-muted">Reviewed</span>
                            )}
                          </div>
                          {openWhy === it.unitId && (
                            <p className="mt-1 max-w-prose text-[15px]">{it.reason}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col pr-2 pt-1">
                          <button
                            type="button"
                            className="inline-flex h-tap w-tap items-center justify-center text-ink disabled:opacity-30"
                            onClick={() => move(it.unitId, -1)}
                            disabled={i === 0}
                            aria-label={`Move ${u.title} up`}
                          >
                            <ChevronUp size={22} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-tap w-tap items-center justify-center text-ink disabled:opacity-30"
                            onClick={() => move(it.unitId, 1)}
                            disabled={i === items.length - 1}
                            aria-label={`Move ${u.title} down`}
                          >
                            <ChevronDown size={22} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  <li className="flex min-h-[64px] items-start border-b border-rule">
                    <div className="w-margin shrink-0 pt-3 text-center font-heading text-[22px] font-semibold text-plum-500">
                      {items.length + 1}
                    </div>
                    <div className="min-w-0 flex-1 py-3 pl-4">
                      <Link
                        to="/plan"
                        className="text-[17px] text-ink no-underline hover:underline"
                      >
                        Plan your next lesson
                      </Link>
                      <div className="text-[13px] text-muted">Lesson builder · about 10 min</div>
                    </div>
                  </li>
                </ol>
              </div>

              <p className="mt-6 max-w-prose text-[15px] text-muted">
                {teachingDaysPerWeek
                  ? `You teach ${teachingDaysPerWeek} day${teachingDaysPerWeek === 1 ? '' : 's'} a week. `
                  : ''}
                {daysOff
                  ? `Learning is spread over ${daysOff} day${daysOff === 1 ? '' : 's'}. Move any unit to a day you're not teaching.`
                  : 'Learning is spread across the week.'}{' '}
                Use the arrows, or drag with a mouse, to change the order.
              </p>

              <details className="mt-6 max-w-prose border-t border-rule pt-3">
                <summary className="min-h-tap cursor-pointer text-[17px] font-bold">
                  Further reading (optional)
                  {picked.size > 0 && (
                    <span className="font-normal text-muted">
                      {' '}
                      · {picked.size} suggested for you
                    </span>
                  )}
                </summary>
                <p className="mt-1 text-[15px] text-muted">
                  From sources the Allegro team has checked. These open in a new tab.
                </p>
                <ul className="mt-2">
                  {furtherReading.map((src) => (
                    <li key={src.id} className="border-b border-rule py-2">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-green-700 underline"
                      >
                        {src.title}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      <div className="text-[13px] text-muted">{src.organisation}</div>
                      <p className="text-[15px]">{src.summary}</p>
                      {picked.has(src.id) && (
                        <p className="mt-1 border-l-4 border-green-700 pl-3 text-[15px]">
                          <span className="block text-[13px] text-muted">
                            Suggested for you by Allegro AI
                          </span>
                          {picked.get(src.id)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
              <p className="mt-2">
                <Link to="/needs" className="text-green-700 underline">
                  Change my needs
                </Link>
              </p>
              <Thumbs target="pathway" label="Does this week fit your time?" />
            </>
          )}
        </MarginLayout>
        <DockedQuickHelp />
      </div>
    </AppShell>
  );
}

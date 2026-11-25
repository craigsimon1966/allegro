import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label } from '@/components/Label';
import { Button } from '@/components/Button';
import { AIBlock } from '@/components/AIBlock';
import { MathText } from '@/components/MathText';
import { MathTextarea } from '@/components/MathTextarea';
import { unitById } from '@shared/catalogue';
import { findLikelyStudentNames } from '@shared/pii';
import { reflectOn, saveNeedEdit, saveReflection } from '@/lib/api';
import { useAppStore, type Reflection } from '@/lib/store';

// Reflect (SPEC 7.9): three prompts, about two minutes, optional concern re-rating (1 not a concern, 5 a big concern).

const HOW = ['Most students got it', 'About half got it', 'Few got it'];
const field = 'mt-1 w-full rounded border-2 border-ink bg-field p-3 text-[17px] text-ink';

function nextSuggestion(): string | null {
  const { pathway, progress } = useAppStore.getState();
  const next = [...(pathway ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((it) => !progress[it.unitId]?.completedAt);
  return next?.unitId ?? null;
}

export default function Reflect() {
  const mode = useAppStore((s) => s.mode);
  const allNeeds = useAppStore((s) => s.needs);
  const needs = allNeeds.filter((n) => n.status === 'active');
  const lessons = useAppStore((s) => s.lessons);
  const addReflection = useAppStore((s) => s.addReflection);
  const updateNeed = useAppStore((s) => s.updateNeed);
  const latest = Object.values(lessons).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  const [tried, setTried] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [how, setHow] = useState('');
  const [note, setNote] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Reflection | null>(null);

  if (mode === 'anonymous') return <Navigate to="/demo" replace />;

  const triedText = [...picked, tried.trim()].filter(Boolean).join('; ');
  const happened = [how, note.trim()].filter(Boolean).join('. ');
  const names = findLikelyStudentNames([tried, note, nextTime].join('\n'));
  const empty = !triedText && !happened && !nextTime.trim();

  const submit = async () => {
    setBusy(true);
    const base: Reflection = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      at: new Date().toISOString(),
      lessonId: latest?.lesson.lesson_id ?? null,
      tried: triedText,
      happened,
      nextTime: nextTime.trim(),
      ratings,
      observation: null,
      suggestedUnitId: null,
    };
    let r = base;
    try {
      const ai = await reflectOn(
        base,
        needs.map((n) => ({ topic: n.topic, tags: n.catalogue_tags })),
      );
      r = { ...base, observation: ai.observation, suggestedUnitId: ai.suggestedUnitId };
    } catch {
      // The reflection still saves; the next step comes from the week instead.
    }
    if (!r.suggestedUnitId) r = { ...r, suggestedUnitId: nextSuggestion() };
    addReflection(r);
    for (const [id, rating] of Object.entries(ratings)) {
      updateNeed(id, { selfRating: rating });
      const n = needs.find((x) => x.id === id);
      if (n) void saveNeedEdit({ ...n, selfRating: rating }).catch(() => undefined);
    }
    void saveReflection(r).catch(() => undefined);
    setDone(r);
    setBusy(false);
  };

  if (done) {
    const unit = done.suggestedUnitId ? unitById(done.suggestedUnitId) : undefined;
    return (
      <AppShell step={6}>
        <MarginLayout>
          <Label>Reflect</Label>
          <h1 className="mt-1 text-[30px] leading-tight">Thanks, that&apos;s saved</h1>
          <p className="mt-2 text-muted">Only you can see your reflections.</p>
          {done.observation && (
            <div className="mt-6 max-w-prose">
              <AIBlock label="AI" headingLevel={2} title="Something we noticed">
                <MathText>{done.observation}</MathText>
              </AIBlock>
            </div>
          )}
          {unit && (
            <div className="mt-6 max-w-prose">
              <h2 className="text-[20px] font-semibold">A good next step</h2>
              <p className="mt-1">
                <Link to={`/learn/${unit.id}`} className="font-bold text-green-700 underline">
                  <MathText inline>{unit.title}</MathText>
                </Link>{' '}
                · {unit.durationMinutes} min
              </p>
            </div>
          )}
          <p className="mt-8 flex flex-wrap gap-x-5">
            <Link to="/growth" className="font-bold text-green-700 underline">
              See your growth
            </Link>
            <Link to="/survey" className="text-green-700 underline">
              Tell us about the pilot (1 minute)
            </Link>
            <Link to="/pathway" className="text-green-700 underline">
              Back to this week
            </Link>
          </p>
        </MarginLayout>
      </AppShell>
    );
  }

  return (
    <AppShell step={6}>
      <MarginLayout>
        <Label>Reflect · step 6 of 6</Label>
        <h1 className="mt-1 text-[30px] leading-tight">
          {latest ? `How did "${latest.lesson.title}" go?` : 'How did your lesson go?'}
        </h1>
        <p className="mt-2 text-muted">About two minutes. Only you can see your reflections.</p>

        <form
          className="mt-6 flex max-w-prose flex-col gap-7"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <fieldset>
            <legend className="text-[20px] font-semibold">1. What did you try?</legend>
            {latest && (
              <div className="mt-2 flex flex-col">
                {latest.lesson.blocks
                  .filter((b) => b.type !== 'intention' && b.type !== 'vocabulary')
                  .map((b) => (
                    <label key={b.id} className="flex min-h-tap items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-green-700"
                        checked={picked.includes(b.title)}
                        onChange={(e) =>
                          setPicked(
                            e.target.checked
                              ? [...picked, b.title]
                              : picked.filter((t) => t !== b.title),
                          )
                        }
                      />
                      {b.title}
                    </label>
                  ))}
              </div>
            )}
            <label htmlFor="tried" className="mt-2 block text-[15px] font-bold">
              {latest ? 'Anything else? (optional)' : 'In a sentence or two'}
            </label>
            <MathTextarea
              id="tried"
              rows={2}
              value={tried}
              onChange={setTried}
              className={field}
              maxLength={500}
            />
          </fieldset>

          <fieldset>
            <legend className="text-[20px] font-semibold">2. What happened for students?</legend>
            <div className="mt-2 flex flex-col">
              {HOW.map((h) => (
                <label key={h} className="flex min-h-tap items-center gap-3">
                  <input
                    type="radio"
                    name="how"
                    className="h-5 w-5 accent-green-700"
                    checked={how === h}
                    onChange={() => setHow(h)}
                  />
                  {h}
                </label>
              ))}
            </div>
            <label htmlFor="note" className="mt-2 block text-[15px] font-bold">
              Anything to remember? (optional, no names)
            </label>
            <MathTextarea
              id="note"
              rows={2}
              value={note}
              onChange={setNote}
              className={field}
              maxLength={500}
              placeholder="For example: several still wrote y = x + 2 on the exit ticket"
            />
          </fieldset>

          <div>
            <label htmlFor="next" className="block text-[20px] font-semibold">
              3. What will you keep or change?
            </label>
            <MathTextarea
              id="next"
              rows={2}
              value={nextTime}
              onChange={setNextTime}
              className={field}
              maxLength={500}
            />
          </div>

          {needs.length > 0 && (
            <fieldset>
              <legend className="text-[20px] font-semibold">
                How concerning is each one now? (optional)
              </legend>
              {needs.map((n) => (
                <fieldset key={n.id} className="mt-3">
                  <legend className="text-[15px] font-bold">{n.topic}</legend>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <label
                        key={v}
                        className={`relative flex h-tap w-tap cursor-pointer items-center justify-center rounded border-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-green-700 ${
                          ratings[n.id] === v
                            ? 'border-green-700 bg-sage-100 font-bold'
                            : 'border-ink'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`conf-${n.id}`}
                          className="sr-only"
                          checked={ratings[n.id] === v}
                          onChange={() => setRatings({ ...ratings, [n.id]: v })}
                          aria-label={`${v} of 5`}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                  {n.selfRating && (
                    <p className="mt-1 text-[13px] text-muted">Last time: {n.selfRating} of 5</p>
                  )}
                </fieldset>
              ))}
            </fieldset>
          )}

          {names.length > 0 && (
            <p className="font-bold" role="alert">
              This looks like it might include a student&apos;s name ({names.join(', ')}). Please
              remove it.
            </p>
          )}
          <div>
            <Button type="submit" disabled={busy || empty || names.length > 0}>
              {busy ? 'Saving…' : 'Save and see what’s next'} <span aria-hidden="true">→</span>
            </Button>
          </div>
        </form>
      </MarginLayout>
    </AppShell>
  );
}

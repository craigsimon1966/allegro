import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { AllegroMark } from '@/components/AllegroMark';
import { Button } from '@/components/Button';
import { Label } from '@/components/Label';
import { MarginLayout } from '@/components/MarginLayout';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { findLikelyStudentNames } from '@shared/pii';
import { fallbackDiagnosis } from '@shared/fallbackDiagnosis';
import type { Diagnosis, Guided } from '@shared/schemas';
import { ApiError, diagnose, saveIntakeAndNeeds } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { GuidedFields } from './GuidedFields';

// Situation intake (SPEC 7.3).

const EXAMPLES = [
  "I'm a PE teacher and this year I've been given two Year 8 maths classes. We start linear relationships next week and I'm not confident explaining it.",
  "I'm a casual teacher covering a Year 1 class for a few weeks. I'm secondary trained and not sure how to run the day or teach early number.",
];

type Phase = 'edit' | 'submitting' | 'clarifying' | 'error';

export default function Intake() {
  const navigate = useNavigate();
  const mode = useAppStore((s) => s.mode);
  const stored = useAppStore((s) => s.intake);
  const setIntake = useAppStore((s) => s.setIntake);
  const setDiagnosis = useAppStore((s) => s.setDiagnosis);

  const [text, setText] = useState(stored?.situationText ?? '');
  const [guided, setGuided] = useState<Guided>(stored?.guided ?? { hoursPerWeek: 2 });
  const [showGuided, setShowGuided] = useState(false);
  const [phase, setPhase] = useState<Phase>('edit');
  const [names, setNames] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [pending, setPending] = useState<Diagnosis | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const guidedRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (names.length && findLikelyStudentNames(text).length === 0) setNames([]);
  }, [text, names.length]);

  if (mode === 'anonymous') return <Navigate to="/demo" replace />;

  const finish = async (d: Diagnosis) => {
    setIntake({ situationText: text, guided });
    setDiagnosis(d);
    try {
      await saveIntakeAndNeeds(text, d);
    } catch {
      /* Saved locally; a signed-in save failure shouldn't block the teacher. */
    }
    navigate('/needs');
  };

  const run = async (clarifyingAnswers?: string[]) => {
    const found = findLikelyStudentNames([text, ...(clarifyingAnswers ?? [])].join('\n'));
    if (found.length) {
      setNames(found);
      textRef.current?.focus();
      return;
    }
    setPhase('submitting');
    try {
      const d = await diagnose({ situationText: text, guided, clarifyingAnswers });
      if (d.clarifying_questions.length && !clarifyingAnswers) {
        setPending(d);
        setAnswers(d.clarifying_questions.map(() => ''));
        setPhase('clarifying');
        return;
      }
      await finish(d);
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : 'Something went wrong.');
      setPhase('error');
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run();
  };

  const openGuided = () => {
    setShowGuided(true);
    setPhase('edit');
    setTimeout(() => guidedRef.current?.querySelector('select')?.focus(), 0);
  };

  return (
    <AppShell step={1} setup backTo="/demo">
      <MarginLayout>
        <h1 className="text-[30px] leading-tight">Tell us about your teaching</h1>
        <p className="mt-2 max-w-prose">
          What are you teaching, and what feels hard right now? Write it the way you&apos;d tell a
          colleague.
        </p>

        {phase === 'submitting' ? (
          <div role="status" className="mt-10 flex flex-col items-start gap-3">
            <AllegroMark size={48} loading />
            <p className="font-heading text-[22px]">Reading your situation</p>
            <p className="text-muted">This usually takes a few seconds.</p>
          </div>
        ) : phase === 'clarifying' && pending ? (
          <form
            className="mt-6 flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              void run(
                answers.map((a) => a.trim()).filter(Boolean).length ? answers : undefined,
              ).then(() => undefined);
            }}
          >
            <p className="font-bold">A quick question or two, so we get this right:</p>
            {pending.clarifying_questions.map((q, i) => (
              <div key={q}>
                <label htmlFor={`clarify-${i}`} className="mb-1.5 block">
                  {q}
                </label>
                <input
                  id={`clarify-${i}`}
                  className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
                  value={answers[i] ?? ''}
                  onChange={(e) =>
                    setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))
                  }
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Update my needs</Button>
              <Button variant="secondary" onClick={() => void finish(pending)}>
                Skip
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
            <div>
              <Label as="label" htmlFor="situation" className="mb-1.5 block">
                Your situation
              </Label>
              <div className="flex items-start gap-2">
                <textarea
                  id="situation"
                  ref={textRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={7}
                  maxLength={4000}
                  required
                  aria-describedby="privacy-note"
                  aria-invalid={names.length > 0}
                  className="min-h-[180px] w-full rounded border-2 border-ink bg-field p-3 text-[17px] leading-normal text-ink"
                />
                <VoiceInputButton onText={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
              </div>
              <p id="privacy-note" className="mt-1.5 text-sm text-muted">
                Please don&apos;t include student names or personal details.
              </p>
              {names.length > 0 && (
                <div role="alert" className="mt-2 border-l-4 border-warning bg-surface py-2 pl-3">
                  <p className="font-bold">
                    It looks like this includes a student&apos;s name ({names.join(', ')}).
                  </p>
                  <p>
                    Please take it out before you send. Describe students in general terms instead,
                    for example &quot;one student&quot;.
                  </p>
                </div>
              )}
            </div>

            {!text && (
              <div>
                <p className="mb-2 text-[15px] font-bold">
                  Not sure where to start? Tap an example:
                </p>
                <div className="flex flex-col gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setText(ex)}
                      className="min-h-tap rounded border-2 border-border px-3 py-2 text-left text-[15px] hover:border-green-700 hover:bg-sage-100"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <details
              ref={guidedRef}
              open={showGuided}
              onToggle={(e) => setShowGuided((e.target as HTMLDetailsElement).open)}
              className="border-y border-rule py-3"
            >
              <summary className="min-h-tap cursor-pointer py-2 font-bold text-green-700">
                Add details (optional): role, year levels, time available
              </summary>
              <div className="pt-3">
                <GuidedFields value={guided} onChange={setGuided} />
              </div>
            </details>

            {phase === 'error' && (
              <div role="alert" className="flex flex-col gap-3 border-l-4 border-error py-2 pl-3">
                <p className="font-bold">{errorMsg}</p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void run()}>Try again</Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      showGuided ? void finish(fallbackDiagnosis(text, guided)) : openGuided()
                    }
                  >
                    {showGuided ? 'Continue with my answers' : 'Use the guided questions instead'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!text.trim()}>
                Show me what I need <span aria-hidden="true">→</span>
              </Button>
              {showGuided && phase !== 'error' && (
                <Button
                  variant="secondary"
                  disabled={!text.trim()}
                  onClick={() => void finish(fallbackDiagnosis(text, guided))}
                >
                  Skip the AI, use my answers
                </Button>
              )}
            </div>
          </form>
        )}
      </MarginLayout>
    </AppShell>
  );
}

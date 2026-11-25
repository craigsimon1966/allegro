import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label } from '@/components/Label';
import { Button } from '@/components/Button';
import { AIBlock } from '@/components/AIBlock';
import { MathText } from '@/components/MathText';
import { unitById } from '@shared/catalogue';
import { findLikelyStudentNames } from '@shared/pii';
import { ApiError, askHelp, type HelpAnswer } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Thumbs } from '@/features/feedback/Thumbs';

// Quick Help (SPEC 7.8): a short teaching question, a short answer, one move, one unit.

const EXAMPLES = [
  'A student says 2x means 2 + x. How do I explain it?',
  'How do I check understanding quickly without marking?',
  'My class finds ratio word problems hard. Where do I start?',
];

export default function Help() {
  const mode = useAppStore((s) => s.mode);
  const year = useAppStore((s) => s.diagnosis?.context.year_levels[0]);
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const [answer, setAnswer] = useState<HelpAnswer | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  if (mode === 'anonymous') return <Navigate to="/demo" replace />;

  const names = findLikelyStudentNames(question);
  const ask = async (q: string) => {
    const text = q.trim();
    if (!text) return;
    setBusy(true);
    setProblem('');
    setAnswer(null);
    setMore(false);
    setAsked(text);
    try {
      setAnswer(await askHelp(text, year ? { yearLevel: year } : undefined));
      setQuestion('');
    } catch (e) {
      setProblem(
        e instanceof ApiError
          ? e.message
          : "Allegro's AI isn't available right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const unit = answer?.unitId ? unitById(answer.unitId) : undefined;

  return (
    <AppShell>
      <MarginLayout>
        <Label>Quick Help</Label>
        <h1 className="mt-1 text-[30px] leading-tight">Ask a teaching question</h1>
        <p className="mt-2 max-w-prose text-muted">
          A short answer and one thing to try. Please don&apos;t include student names.
        </p>

        <div className="mt-6 max-w-prose" aria-live="polite">
          {asked && (
            <p className="border-b border-rule pb-3">
              <span className="font-margin text-[22px] text-plum-500">you </span>
              {asked}
            </p>
          )}
          {busy && (
            <p className="mt-3" role="status">
              Thinking about that…
            </p>
          )}
          {problem && (
            <p className="mt-3 font-bold" role="alert">
              {problem}
            </p>
          )}
          {answer && (
            <div className="mt-3">
              <AIBlock label="AI" headingLevel={2} title="Answer">
                <MathText>{answer.answer}</MathText>
                {more && answer.detail && <MathText className="mt-2">{answer.detail}</MathText>}
              </AIBlock>
              {answer.tryTomorrow && (
                <div className="mt-4">
                  <h2 className="text-[17px] font-bold">Try tomorrow</h2>
                  <MathText>{answer.tryTomorrow}</MathText>
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-5">
                {unit && (
                  <Link
                    to={`/learn/${unit.id}`}
                    className="min-h-tap font-bold text-green-700 underline"
                  >
                    Related unit: <MathText inline>{unit.title}</MathText> · {unit.durationMinutes}{' '}
                    min
                  </Link>
                )}
                {answer.detail && (
                  <button
                    type="button"
                    className="min-h-tap font-bold text-plum-700 underline"
                    aria-expanded={more}
                    onClick={() => setMore(!more)}
                  >
                    {more ? 'Less detail' : 'More detail'}
                  </button>
                )}
              </div>
              <Thumbs key={asked} target="help" label="Was this answer helpful?" />
            </div>
          )}
        </div>

        <form
          className="mt-6 max-w-prose"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <label htmlFor="question" className="block text-[15px] font-bold">
            Your question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={600}
            className="mt-1 w-full rounded border-2 border-ink bg-field p-3 text-[17px] text-ink"
          />
          {names.length > 0 && (
            <p className="mt-2 font-bold" role="alert">
              This looks like it might include a student&apos;s name ({names.join(', ')}). Please
              remove it.
            </p>
          )}
          <Button
            type="submit"
            variant="ask"
            className="mt-3"
            disabled={busy || !question.trim() || names.length > 0}
          >
            Ask
          </Button>
        </form>

        {!asked && (
          <div className="mt-6 max-w-prose">
            <h2 className="text-[15px] font-bold">Or try one of these</h2>
            <ul className="mt-1">
              {EXAMPLES.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    className="min-h-tap text-left text-green-700 underline"
                    onClick={() => void ask(q)}
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-6">
          <Link to="/pathway" className="text-green-700 underline">
            Back to this week
          </Link>
        </p>
      </MarginLayout>
    </AppShell>
  );
}

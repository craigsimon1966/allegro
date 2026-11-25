import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Label } from '@/components/Label';
import { Button } from '@/components/Button';
import { AIBlock } from '@/components/AIBlock';
import { MathText } from '@/components/MathText';
import { MathTextarea } from '@/components/MathTextarea';
import { unitById } from '@shared/catalogue';
import { findLikelyStudentNames } from '@shared/pii';
import { ApiError, askHelp, type HelpAnswer } from '@/lib/api';
import { useTeacherProfile } from '@/lib/useTeacherProfile';
import { Thumbs } from '@/features/feedback/Thumbs';
import { VoiceInputButton } from '@/components/VoiceInputButton';

// Quick Help (SPEC 7.8): a short teaching question, a short answer, one move, one unit.
// Used by the /help page and by the slide-over panel (QuickHelpButton).

const EXAMPLES = [
  'A student says 2x means 2 + x. How do I explain it?',
  'How do I check understanding quickly without marking?',
  'My class finds ratio word problems hard. Where do I start?',
];

interface Props {
  /** The page uses h1; the panel supplies its own dialog title, so its heading is h2. */
  headingLevel?: 1 | 2;
  /** Called when the teacher follows a link out of the panel, so the panel can close. */
  onLeave?: () => void;
}

export default function QuickHelpPanel({ headingLevel = 1, onLeave }: Props) {
  const fieldId = useId();
  const profile = useTeacherProfile();
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const [answer, setAnswer] = useState<HelpAnswer | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

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
      setAnswer(
        await askHelp(text, {
          ...(profile.years.length ? { yearLevels: profile.years } : {}),
          ...(profile.role ? { role: profile.role } : {}),
          ...(profile.state ? { state: profile.state } : {}),
        }),
      );
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
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const Sub = headingLevel === 1 ? 'h2' : 'h3';

  return (
    <>
      {headingLevel === 1 && <Label>Quick Help</Label>}
      <Heading
        className={`mt-1 leading-tight ${headingLevel === 1 ? 'text-[30px]' : 'text-[24px]'}`}
      >
        Ask a teaching question
      </Heading>
      <p className="mt-2 max-w-prose text-muted">
        A short answer and one thing to try. Please don&apos;t include student names. If you use the
        microphone, your browser&apos;s speech service turns it into text.
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
            <AIBlock label="AI" headingLevel={headingLevel === 1 ? 2 : 3} title="Answer">
              <MathText>{answer.answer}</MathText>
              {more && answer.detail && <MathText className="mt-2">{answer.detail}</MathText>}
            </AIBlock>
            {answer.tryTomorrow && (
              <div className="mt-4">
                <Sub className="text-[17px] font-bold">Try tomorrow</Sub>
                <MathText>{answer.tryTomorrow}</MathText>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-5">
              {unit && (
                <Link
                  to={`/learn/${unit.id}`}
                  onClick={onLeave}
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
        <label htmlFor={fieldId} className="block text-[15px] font-bold">
          Your question
        </label>
        <div className="mt-1 flex items-start gap-2">
          <MathTextarea
            id={fieldId}
            value={question}
            onChange={setQuestion}
            rows={3}
            maxLength={600}
            className="w-full rounded border-2 border-ink bg-field p-3 text-[17px] text-ink"
          />
          <VoiceInputButton
            onText={(t) => setQuestion((prev) => (prev ? `${prev} ${t}` : t).slice(0, 600))}
          />
        </div>
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
          <Sub className="text-[15px] font-bold">Or try one of these</Sub>
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
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label } from '@/components/Label';
import { Button } from '@/components/Button';
import { findLikelyStudentNames } from '@shared/pii';
import { ApiError, sendFeedback } from '@/lib/api';
import { SURVEY_QUESTIONS } from './questions';

// End-of-loop pilot survey (SPEC 14). Anonymous.

const SCALE = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

export default function Survey() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState('');
  const names = findLikelyStudentNames(comment);

  const submit = async () => {
    setBusy(true);
    setProblem('');
    try {
      await sendFeedback({
        target: 'survey',
        scores,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      setSent(true);
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : 'We could not send that. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <MarginLayout>
        <Label>Pilot survey · about a minute</Label>
        <h1 className="mt-1 text-[30px] leading-tight">How was Allegro for you?</h1>
        {sent ? (
          <>
            <p className="mt-4 max-w-prose">Thank you. Your answers help us shape the pilot.</p>
            <p className="mt-6">
              <Link to="/pathway" className="font-bold text-green-700 underline">
                Back to this week
              </Link>
            </p>
          </>
        ) : (
          <form
            className="mt-6 flex max-w-prose flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <p className="text-muted">Your answers are anonymous.</p>
            {SURVEY_QUESTIONS.map((q, i) => (
              <fieldset key={q}>
                <legend className="font-bold">
                  {i + 1}. {q}
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SCALE.map((s, v) => (
                    <label
                      key={s}
                      className={`flex min-h-tap cursor-pointer items-center rounded border-2 px-3 text-[15px] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-green-700 ${
                        scores[`q${i + 1}`] === v + 1
                          ? 'border-green-700 bg-sage-100 font-bold'
                          : 'border-rule-strong'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${i + 1}`}
                        className="sr-only"
                        checked={scores[`q${i + 1}`] === v + 1}
                        onChange={() => setScores({ ...scores, [`q${i + 1}`]: v + 1 })}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <div>
              <label htmlFor="q6" className="block font-bold">
                6. What would make this more useful for you?
              </label>
              <textarea
                id="q6"
                rows={3}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1 w-full rounded border-2 border-ink bg-field p-3 text-[17px] text-ink"
              />
            </div>
            {names.length > 0 && (
              <p className="font-bold" role="alert">
                Please remove the student name ({names.join(', ')}).
              </p>
            )}
            {problem && (
              <p className="font-bold" role="alert">
                {problem}
              </p>
            )}
            <div>
              <Button
                type="submit"
                disabled={
                  busy || names.length > 0 || (!Object.keys(scores).length && !comment.trim())
                }
              >
                Send my answers
              </Button>
            </div>
          </form>
        )}
      </MarginLayout>
    </AppShell>
  );
}

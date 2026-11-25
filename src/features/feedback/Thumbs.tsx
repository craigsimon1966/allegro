import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/Button';
import { findLikelyStudentNames } from '@shared/pii';
import { ApiError, sendFeedback } from '@/lib/api';

// Thumbs up or down, with an optional comment (SPEC 14). Anonymous.

export function Thumbs({ target, label = 'Was this useful?' }: { target: string; label?: string }) {
  const [thumbs, setThumbs] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [problem, setProblem] = useState('');
  const id = `fb-${target.replace(/[^a-z0-9]/gi, '-')}`;

  const send = async (t: 1 | -1, c?: string) => {
    setProblem('');
    try {
      await sendFeedback({ target, thumbs: t, ...(c ? { comment: c } : {}) });
      if (c !== undefined) setSent(true);
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : 'We could not send that. Please try again.');
    }
  };

  if (sent) return <p className="mt-6 text-[15px] text-muted">Thanks for the feedback.</p>;
  const names = findLikelyStudentNames(comment);
  return (
    <div
      className="no-print mt-6 max-w-prose border-t border-rule pt-3"
      role="group"
      aria-label={label}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[15px]">{label}</span>
        <span className="flex gap-3">
          {([1, -1] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={thumbs === t}
              onClick={() => {
                setThumbs(t);
                void send(t);
              }}
              className={`inline-flex h-tap w-tap items-center justify-center rounded border-2 ${
                thumbs === t
                  ? 'border-green-700 bg-sage-100 text-green-700'
                  : 'border-rule-strong text-ink'
              }`}
            >
              {t === 1 ? (
                <ThumbsUp size={20} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <ThumbsDown size={20} strokeWidth={1.5} aria-hidden="true" />
              )}
              <span className="sr-only">{t === 1 ? 'Helpful' : 'Not quite'}</span>
            </button>
          ))}
        </span>
      </div>
      {thumbs !== null && (
        <div className="mt-2">
          <label htmlFor={id} className="block text-[15px] font-bold">
            Anything to add? (optional, anonymous)
          </label>
          <textarea
            id={id}
            rows={2}
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full rounded border-2 border-ink bg-field p-3 text-[17px] text-ink"
          />
          {names.length > 0 && (
            <p className="mt-1 font-bold" role="alert">
              Please remove the student name ({names.join(', ')}).
            </p>
          )}
          <Button
            variant="secondary"
            className="mt-2"
            disabled={names.length > 0}
            onClick={() => (comment.trim() ? void send(thumbs, comment.trim()) : setSent(true))}
          >
            Send
          </Button>
        </div>
      )}
      {problem && (
        <p className="mt-2 font-bold" role="alert">
          {problem}
        </p>
      )}
    </div>
  );
}

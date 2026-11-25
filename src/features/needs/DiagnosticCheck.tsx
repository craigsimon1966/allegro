import { useId, useState } from 'react';
import { Button } from '@/components/Button';
import { MathText } from '@/components/MathText';
import {
  RESULT_LABELS,
  calibrationMessage,
  isCorrect,
  itemsForTag,
  resultFor,
  type DiagnosticResult,
} from '@shared/diagnostics';

// "Check yourself" (SPEC 7.4). Feedback per item, then a plain-language result. Never a score out of 100.

interface Props {
  tag: string;
  topic: string;
  selfRating: number | null;
  onDone: (result: DiagnosticResult) => void;
  onClose: () => void;
}

export function DiagnosticCheck({ tag, topic, selfRating, onDone, onClose }: Props) {
  const items = itemsForTag(tag);
  const baseId = useId();
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState<boolean | null>(null);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  if (result) {
    return (
      <div className="mt-3 border-l-4 border-green-700 py-2 pl-3" role="status">
        <p className="font-bold">
          {topic}: {RESULT_LABELS[result]}
        </p>
        <p className="mt-1">{calibrationMessage(selfRating, result, topic)}</p>
        <Button variant="secondary" className="mt-3" onClick={onClose}>
          Back to my needs
        </Button>
      </div>
    );
  }

  const item = items[i];
  if (!item) return null;
  const inputId = `${baseId}-answer`;
  const check = () => {
    const ok = isCorrect(item, answer);
    setChecked(ok);
    if (ok) setCorrect((c) => c + 1);
  };
  const next = () => {
    if (i + 1 >= items.length) {
      const r = resultFor(correct, items.length);
      setResult(r);
      onDone(r);
      return;
    }
    setI(i + 1);
    setAnswer('');
    setChecked(null);
  };

  return (
    <div className="mt-3 border-t border-rule pt-3">
      <p className="text-[13px] uppercase tracking-[0.12em] text-muted">
        Question {i + 1} of {items.length}
      </p>
      <MathText className="mt-1">{item.stemMd}</MathText>

      {item.type === 'mcq' && item.options ? (
        <fieldset className="mt-2" disabled={checked !== null}>
          <legend className="sr-only">Choose an answer</legend>
          <div className="flex flex-col gap-2">
            {item.options.map((o) => (
              <label
                key={o}
                className={`flex min-h-tap cursor-pointer items-center gap-3 rounded border-2 px-3 py-2 ${answer === o ? 'border-green-700 bg-sage-100' : 'border-border'}`}
              >
                <input
                  type="radio"
                  name={`${baseId}-${item.id}`}
                  value={o}
                  checked={answer === o}
                  onChange={() => setAnswer(o)}
                  className="h-5 w-5 accent-green-700"
                />
                <MathText inline>{o}</MathText>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <div className="mt-2">
          <label htmlFor={inputId} className="mb-1 block font-bold">
            Your answer
          </label>
          <input
            id={inputId}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            readOnly={checked !== null}
            inputMode={item.type === 'numeric' ? 'decimal' : 'text'}
            className="h-12 w-full max-w-[16rem] rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
          />
        </div>
      )}

      {checked !== null && (
        <div
          role="status"
          className={`mt-3 border-l-4 py-1 pl-3 ${checked ? 'border-success' : 'border-warning'}`}
        >
          <p className="font-bold">{checked ? 'Correct' : 'Not quite'}</p>
          <MathText>{checked ? item.feedbackCorrect : item.feedbackIncorrect}</MathText>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        {checked === null ? (
          <Button onClick={check} disabled={!answer.trim()}>
            Check
          </Button>
        ) : (
          <Button onClick={next}>
            {i + 1 >= items.length ? 'See how I went' : 'Next question'}
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Stop for now
        </Button>
      </div>
    </div>
  );
}

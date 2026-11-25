import { useEffect, useState } from 'react';
import { AllegroMark } from './AllegroMark';

interface Props {
  /** What is being made, for example "Building your week". Shown as the heading. */
  title: string;
  /** What the AI is doing, in order. Each shows for an equal share of the expected time. */
  steps: string[];
  /** A rough typical wait, in seconds. Used for the bar and the "about N seconds left" line. */
  expectedSeconds: number;
  /** Shown once the wait passes the expected time, for example what happens if it fails. */
  slowNote?: string;
}

/**
 * Waiting screen for an AI call: the animated mark, the current step, a progress bar and a
 * rough time left. AI replies have no real progress to report, so the bar follows the clock and
 * slows near the end rather than claiming to be finished. The step changes are announced to
 * screen readers; the seconds are not, so they don't talk every second.
 */
export function AIProgress({ title, steps, expectedSeconds, slowNote }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - start) / 1000), 500);
    return () => clearInterval(t);
  }, []);

  const ratio = elapsed / expectedSeconds;
  // Up to 85% on time, then creeping towards 95%; never 100% until the screen changes.
  const percent = Math.round(
    ratio <= 1 ? ratio * 85 : 85 + 10 * (1 - Math.exp(-(ratio - 1) * 1.5)),
  );
  const step = steps[Math.min(steps.length - 1, Math.floor(ratio * steps.length))] ?? '';
  const left = Math.ceil(expectedSeconds - elapsed);
  const slow = left <= 0;
  const timeLine = slow
    ? 'Taking a little longer than usual. Nearly there.'
    : left <= 5
      ? 'A few seconds left.'
      : `About ${left} seconds left.`;

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-3">
      <AllegroMark size={48} loading />
      <p className="font-heading text-[22px]">{title}</p>
      <p role="status" aria-live="polite" className="min-h-[1.5em]">
        {step}
      </p>
      <div
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full rounded-[2px] bg-plum-100"
      >
        <div
          className="h-full rounded-[2px] bg-plum-500 transition-[width] duration-500 ease-linear motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-muted" aria-hidden="true">
        {timeLine}
      </p>
      {slow && slowNote && <p className="text-sm text-muted">{slowNote}</p>}
    </div>
  );
}

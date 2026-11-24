import { LOOP_STEPS } from './loopSteps';

interface Props {
  /** 1 to 6 */
  current: number;
  /** Show the step name after the count, e.g. "Step 4 of 6: Learn". */
  showName?: boolean;
}

/** Six squares for the loop, filled Green 700 when reached, with a text label (never colour alone). */
export function StepSquares({ current, showName = true }: Props) {
  const step = Math.min(Math.max(current, 1), LOOP_STEPS.length);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[15px] font-bold">
        Step {step} of {LOOP_STEPS.length}
        {showName && `: ${LOOP_STEPS[step - 1]}`}
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {LOOP_STEPS.map((name, i) => (
          <div
            key={name}
            data-filled={i < step}
            className={`h-3 w-3 ${i < step ? 'bg-green-700' : 'border-[1.5px] border-muted'}`}
          />
        ))}
      </div>
    </div>
  );
}

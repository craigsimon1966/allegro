import type { Guided } from '@shared/schemas';

// Optional guided fields for the intake (SPEC 7.3). Also the fallback when the AI is unavailable.

const ROLES: { value: NonNullable<Guided['role']>; label: string }[] = [
  { value: 'out_of_field', label: 'Teaching outside my trained subject' },
  { value: 'early_career', label: 'Early career (first few years)' },
  { value: 'casual', label: 'Casual or relief' },
  { value: 'experienced', label: 'Experienced in this subject' },
  { value: 'leader', label: 'School leader' },
];

const YEARS = ['F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const field = 'h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink';
const legend = 'mb-1.5 text-[15px] font-bold';

function toggle<T>(list: T[] | undefined, v: T): T[] {
  const l = list ?? [];
  return l.includes(v) ? l.filter((x) => x !== v) : [...l, v];
}

function hoursLabel(h: number) {
  return h < 1 ? `${h * 60} min` : `${h} hour${h === 1 ? '' : 's'}`;
}

export function GuidedFields({
  value,
  onChange,
}: {
  value: Guided;
  onChange: (g: Guided) => void;
}) {
  const set = (patch: Partial<Guided>) => onChange({ ...value, ...patch });
  const hours = value.hoursPerWeek ?? 2;
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="g-role" className={legend + ' block'}>
          Your role
        </label>
        <select
          id="g-role"
          className={field}
          value={value.role ?? ''}
          onChange={(e) => set({ role: (e.target.value || undefined) as Guided['role'] })}
        >
          <option value="">Choose one</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={legend}>Year levels you teach</legend>
        <div className="flex flex-wrap gap-2">
          {YEARS.map((y) => {
            const on = value.yearLevels?.includes(y) ?? false;
            return (
              <label
                key={y}
                className={`inline-flex min-h-tap min-w-tap cursor-pointer items-center justify-center rounded border-2 px-2 font-bold ${on ? 'border-green-700 bg-sage-100 text-ink' : 'border-border text-ink'}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => set({ yearLevels: toggle(value.yearLevels, y) })}
                />
                {y === 'F' ? 'F' : `Yr ${y}`}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="g-subject" className={legend + ' block'}>
          Subject
        </label>
        <input
          id="g-subject"
          className={field}
          value={value.subject ?? ''}
          onChange={(e) => set({ subject: e.target.value || undefined })}
          placeholder="Mathematics"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="g-school" className={legend + ' block'}>
            School type
          </label>
          <select
            id="g-school"
            className={field}
            value={value.schoolType ?? ''}
            onChange={(e) =>
              set({ schoolType: (e.target.value || undefined) as Guided['schoolType'] })
            }
          >
            <option value="">Choose one</option>
            <option value="government">Government</option>
            <option value="catholic">Catholic</option>
            <option value="independent">Independent</option>
          </select>
        </div>
        <div>
          <label htmlFor="g-location" className={legend + ' block'}>
            Location
          </label>
          <select
            id="g-location"
            className={field}
            value={value.locationType ?? ''}
            onChange={(e) =>
              set({ locationType: (e.target.value || undefined) as Guided['locationType'] })
            }
          >
            <option value="">Choose one</option>
            <option value="metro">Metro</option>
            <option value="regional">Regional</option>
            <option value="rural">Rural</option>
            <option value="remote">Remote</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="g-weeks" className={legend + ' block'}>
          How many weeks is this for? <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="g-weeks"
          type="number"
          inputMode="numeric"
          min={1}
          max={52}
          className={field + ' max-w-[10rem]'}
          value={value.weeks ?? ''}
          onChange={(e) =>
            set({
              weeks: e.target.value ? Math.min(52, Math.max(1, Number(e.target.value))) : null,
            })
          }
        />
      </div>

      <fieldset>
        <legend className={legend}>Days you teach</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => {
            const n = i + 1;
            const on = value.teachingDays?.includes(n) ?? false;
            return (
              <label
                key={d}
                className={`inline-flex min-h-tap min-w-[56px] cursor-pointer items-center justify-center rounded border-2 px-2 font-bold ${on ? 'border-green-700 bg-sage-100 text-ink' : 'border-border text-ink'}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => set({ teachingDays: toggle(value.teachingDays, n).sort() })}
                />
                {d}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="g-hours" className={legend + ' block'}>
          Time for learning each week: <span className="text-green-700">{hoursLabel(hours)}</span>
        </label>
        <input
          id="g-hours"
          type="range"
          min={0.5}
          max={5}
          step={0.5}
          value={hours}
          onChange={(e) => set({ hoursPerWeek: Number(e.target.value) })}
          className="w-full accent-green-700"
          aria-valuetext={hoursLabel(hours)}
        />
        <div className="flex justify-between text-[13px] text-muted">
          <span>30 min</span>
          <span>5 hours</span>
        </div>
      </div>
    </div>
  );
}

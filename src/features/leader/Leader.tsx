import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { MathText } from '@/components/MathText';
import { unitById } from '@shared/catalogue';
import { tagById } from '@shared/tags';
import data from '../../../content/leader-demo.json';

// Leader preview (SPEC 7.11). Fictional aggregate data only: no teacher names, no reflections.

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="h-3 flex-1 bg-sage-100">
        <div
          className="h-3 rounded-r-[2px] bg-green-700"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-[15px] tabular-nums">{label}</span>
    </div>
  );
}

export default function Leader() {
  const maxUnits = Math.max(...data.mostUsedUnits.map((u) => u.completions));
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div
          className="border-y-2 border-warning bg-surface px-5 py-3 text-center font-bold"
          role="note"
        >
          Preview with fictional data. No real teachers, schools or results are shown.
        </div>
        <MarginLayout>
          <Label>Leader preview · {data.school}</Label>
          <h1 className="mt-1 text-[30px] leading-tight">How your staff are growing</h1>
          <p className="mt-2 max-w-prose text-muted">
            {data.staffCount} staff using Allegro, {data.outOfFieldCount} teaching maths out of
            field. Leaders see totals only, never individual teachers or their reflections.
          </p>

          <section className="mt-8 max-w-prose" aria-labelledby="conf">
            <SectionRule id="conf">Average confidence by area (1 to 5)</SectionRule>
            <table className="mt-2 w-full text-left text-[15px]">
              <caption className="sr-only">
                Average staff confidence at the start and now, out of 5
              </caption>
              <thead>
                <tr className="border-b border-rule-strong">
                  <th className="py-1.5 pr-3">Area</th>
                  <th className="py-1.5 pr-3">At the start</th>
                  <th className="w-1/2 py-1.5">Now</th>
                </tr>
              </thead>
              <tbody>
                {data.confidenceByDomain.map((d) => (
                  <tr key={d.domain} className="border-b border-rule">
                    <td className="py-2 pr-3">{d.label}</td>
                    <td className="py-2 pr-3 tabular-nums">{d.start.toFixed(1)}</td>
                    <td className="py-2">
                      <span className="sr-only">{d.now.toFixed(1)}</span>
                      <Bar value={d.now} max={5} label={d.now.toFixed(1)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-8 max-w-prose" aria-labelledby="units">
            <SectionRule id="units">Most used units this term</SectionRule>
            <table className="mt-2 w-full text-left text-[15px]">
              <caption className="sr-only">
                Units completed most often, with number of completions
              </caption>
              <thead>
                <tr className="border-b border-rule-strong">
                  <th className="py-1.5 pr-3">Unit</th>
                  <th className="w-2/5 py-1.5">Completions</th>
                </tr>
              </thead>
              <tbody>
                {data.mostUsedUnits.map((u) => (
                  <tr key={u.unitId} className="border-b border-rule">
                    <td className="py-2 pr-3">
                      <MathText inline>{unitById(u.unitId)?.title ?? u.unitId}</MathText>
                    </td>
                    <td className="py-2">
                      <span className="sr-only">{u.completions}</span>
                      <Bar value={u.completions} max={maxUnits} label={String(u.completions)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-8 max-w-prose" aria-labelledby="oof">
            <SectionRule id="oof">Where out-of-field staff want support</SectionRule>
            <ul className="mt-2">
              {data.outOfFieldTopics.map((t) => (
                <li key={t.tag} className="border-b border-rule py-2">
                  {tagById(t.tag)?.label ?? t.tag}{' '}
                  <span className="text-muted">
                    · {t.staff} of {data.outOfFieldCount} staff
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 max-w-prose" aria-labelledby="focus">
            <SectionRule id="focus">Suggested whole-school focus</SectionRule>
            <p className="mt-2">{data.suggestedFocus}</p>
          </section>

          <p className="mt-8">
            <Link to="/" className="text-green-700 underline">
              Back to home
            </Link>
          </p>
        </MarginLayout>
      </main>
    </>
  );
}

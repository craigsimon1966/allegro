import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { MathText } from '@/components/MathText';
import { unitById } from '@shared/catalogue';
import { useAppStore, type Reflection, type TeacherNeed } from '@/lib/store';

// Your growth (SPEC 7.10). No badges or streaks. Every chart has a table beside it.

const fmt = (iso: string) =>
  new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(new Date(iso));

interface Point {
  label: string;
  rating: number;
}

/** Confidence per need: the first rating, then each reflection that re-rated it. */
function seriesFor(need: TeacherNeed, reflections: Reflection[]): Point[] {
  const later = reflections
    .filter((r) => r.ratings[need.id])
    .map((r) => ({ label: fmt(r.at), rating: r.ratings[need.id]! }));
  // selfRating holds the latest value, so the starting point is the first one we know.
  const first = later.length ? null : need.selfRating;
  return [...(first ? [{ label: 'Start', rating: first }] : []), ...later];
}

function MiniChart({ title, points }: { title: string; points: Point[] }) {
  const w = 240;
  const h = 96;
  const pad = { l: 22, r: 10, t: 8, b: 8 };
  const x = (i: number) =>
    points.length === 1
      ? (pad.l + w - pad.r) / 2
      : pad.l + (i * (w - pad.l - pad.r)) / (points.length - 1);
  const y = (v: number) => pad.t + ((5 - v) * (h - pad.t - pad.b)) / 4;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-24 w-full max-w-[320px]"
      role="img"
      aria-label={`${title}: confidence ${points.map((p) => `${p.label} ${p.rating} of 5`).join(', ')}`}
    >
      {[1, 3, 5].map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--rule)"
            strokeWidth={1}
          />
          <text x={4} y={y(v) + 4} fontSize={11} fill="var(--muted)">
            {v}
          </text>
        </g>
      ))}
      {points.length > 1 && (
        <polyline
          points={points.map((p, i) => `${x(i)},${y(p.rating)}`).join(' ')}
          fill="none"
          stroke="var(--green-700)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.rating)} r={10} fill="transparent">
            <title>{`${p.label}: ${p.rating} of 5`}</title>
          </circle>
          <circle
            cx={x(i)}
            cy={y(p.rating)}
            r={4.5}
            fill="var(--green-700)"
            stroke="var(--surface)"
            strokeWidth={2}
            pointerEvents="none"
          />
        </g>
      ))}
    </svg>
  );
}

export default function Growth() {
  const mode = useAppStore((s) => s.mode);
  const allNeeds = useAppStore((s) => s.needs);
  const reflections = useAppStore((s) => s.reflections);
  const progress = useAppStore((s) => s.progress);
  const lessons = useAppStore((s) => s.lessons);
  const pathway = useAppStore((s) => s.pathway);

  if (mode === 'anonymous') return <Navigate to="/demo" replace />;

  const needs = allNeeds.filter((n) => n.status === 'active');
  const completed = Object.entries(progress).filter(([, p]) => p.completedAt);
  const minutes = completed.reduce((s, [id]) => s + (unitById(id)?.durationMinutes ?? 0), 0);
  const lessonCount = Object.keys(lessons).length;
  const next = [...(pathway ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((it) => !progress[it.unitId]?.completedAt);
  const nextUnit = next ? unitById(next.unitId) : undefined;
  const rated = needs.map((n) => ({ need: n, points: seriesFor(n, reflections) }));
  const hasRatings = rated.some((r) => r.points.length);

  return (
    <AppShell>
      <MarginLayout>
        <Label>Your growth</Label>
        <h1 className="mt-1 text-[30px] leading-tight">How you&apos;re going</h1>

        <dl className="mt-6 grid max-w-prose grid-cols-3 border-y-2 border-rule-strong">
          {[
            ['Units done', completed.length],
            ['Minutes learning', minutes],
            ['Lessons planned', lessonCount],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex flex-col justify-between border-r border-rule px-3 py-3 last:border-r-0"
            >
              <dt className="text-[13px] text-muted">{k}</dt>
              <dd className="font-heading text-[28px] font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 max-w-prose">
          <SectionRule>Next best step</SectionRule>
          {nextUnit ? (
            <p className="mt-3">
              <Link to={`/learn/${nextUnit.id}`} className="font-bold text-green-700 underline">
                <MathText inline>{nextUnit.title}</MathText>
              </Link>{' '}
              · {nextUnit.durationMinutes} min
            </p>
          ) : lessonCount === 0 ? (
            <p className="mt-3">
              <Link to="/plan" className="font-bold text-green-700 underline">
                Plan your next lesson
              </Link>
            </p>
          ) : (
            <p className="mt-3">
              <Link to="/reflect" className="font-bold text-green-700 underline">
                Reflect on your last lesson
              </Link>
            </p>
          )}
        </div>

        <div className="mt-8 max-w-prose">
          <SectionRule>Confidence by topic</SectionRule>
          {!hasRatings ? (
            <p className="mt-3 text-muted">
              Rate your confidence on your needs or after a lesson, and it will show here.
            </p>
          ) : (
            <>
              <ul>
                {rated
                  .filter((r) => r.points.length)
                  .map(({ need, points }) => (
                    <li key={need.id} className="border-b border-rule py-3">
                      <h3 className="text-[17px] font-bold">{need.topic}</h3>
                      <MiniChart title={need.topic} points={points} />
                    </li>
                  ))}
              </ul>
              <details className="mt-3">
                <summary className="min-h-tap cursor-pointer font-bold text-green-700 underline">
                  Show as a table
                </summary>
                <table className="mt-2 w-full text-left text-[15px]">
                  <thead>
                    <tr className="border-b border-rule-strong">
                      <th className="py-1 pr-3">Topic</th>
                      <th className="py-1 pr-3">When</th>
                      <th className="py-1">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rated.flatMap(({ need, points }) =>
                      points.map((p, i) => (
                        <tr key={`${need.id}-${i}`} className="border-b border-rule">
                          <td className="py-1 pr-3">{need.topic}</td>
                          <td className="py-1 pr-3">{p.label}</td>
                          <td className="py-1">{p.rating} of 5</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </details>
            </>
          )}
        </div>

        <div className="mt-8 max-w-prose">
          <SectionRule>Your reflections</SectionRule>
          {reflections.length === 0 ? (
            <p className="mt-3 text-muted">
              After you teach a lesson,{' '}
              <Link to="/reflect" className="text-green-700 underline">
                take two minutes to reflect
              </Link>
              .
            </p>
          ) : (
            <ol>
              {[...reflections].reverse().map((r) => (
                <li key={r.id} className="border-b border-rule py-3">
                  <div className="text-[13px] text-muted">{fmt(r.at)}</div>
                  {r.tried && <p>Tried: {r.tried}</p>}
                  {r.happened && <p>Students: {r.happened}</p>}
                  {r.nextTime && <p>Next time: {r.nextTime}</p>}
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-[13px] text-muted">Only you can see your reflections.</p>
          <p className="mt-6">
            <Link to="/survey" className="text-green-700 underline">
              Tell us about the pilot (1 minute)
            </Link>
          </p>
        </div>
      </MarginLayout>
    </AppShell>
  );
}

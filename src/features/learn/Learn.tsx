import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label } from '@/components/Label';
import { Button } from '@/components/Button';
import { DraftBadge } from '@/components/DraftBadge';
import { MathText } from '@/components/MathText';
import { misconceptionById, unitById } from '@shared/catalogue';
import { findLikelyStudentNames } from '@shared/pii';
import { DOMAIN_LABELS } from '@shared/tags';
import type { CheckItem, MicroUnit } from '@shared/types';
import { useAppStore } from '@/lib/store';
import { AIBlock } from '@/components/AIBlock';
import { ApiError, explain, saveUnitProgress } from '@/lib/api';

// Micro-unit player (SPEC 7.6): hook, core idea, worked example, misconception, check,
// try tomorrow, reflect. One section per page, with a progress bar.

type Page = { key: string; label: string; body: ReactNode };

const normalise = (s: string) => s.replace(/[$\s]/g, '').toLowerCase();

function Check({ item, onAnswered }: { item: CheckItem; onAnswered: (correct: boolean) => void }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const submit = () => {
    const ok = normalise(value) === normalise(item.answer);
    setResult(ok);
    onAnswered(ok);
  };
  return (
    <fieldset className="mt-5 border-b border-rule pb-5">
      <legend className="text-[17px] font-bold">
        <MathText inline>{item.stemMd}</MathText>
      </legend>
      {item.type === 'mcq' ? (
        <div className="mt-3 flex flex-col gap-2">
          {(item.options ?? []).map((o) => (
            <label key={o} className="flex min-h-tap cursor-pointer items-center gap-3">
              <input
                type="radio"
                name={item.id}
                value={o}
                checked={value === o}
                onChange={() => setValue(o)}
                className="h-5 w-5 accent-green-700"
              />
              <MathText inline>{o}</MathText>
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <label htmlFor={`${item.id}-answer`} className="block text-[15px] font-bold">
            Your answer
          </label>
          <input
            id={`${item.id}-answer`}
            inputMode={item.type === 'numeric' ? 'decimal' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-12 w-40 rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
          />
        </div>
      )}
      <Button variant="secondary" className="mt-3" onClick={submit} disabled={!value}>
        Check my answer
      </Button>
      <div aria-live="polite">
        {result !== null && (
          <div className="mt-3 max-w-prose">
            <p className={`font-bold ${result ? 'text-green-700' : 'text-ink'}`}>
              {result ? 'Correct.' : 'Not quite.'}
            </p>
            <MathText>{result ? item.feedbackCorrect : item.feedbackIncorrect}</MathText>
          </div>
        )}
      </div>
    </fieldset>
  );
}

type Style = 'simpler' | 'different_context';
const STYLE_LABEL: Record<Style, string> = {
  simpler: 'More simply',
  different_context: 'With a different example',
};

/** "Explain this differently" (SPEC 7.6): AI, labelled, grounded in this unit only. */
function ExplainDifferently({ unitId }: { unitId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Style | null>(null);
  const [result, setResult] = useState<{ style: Style; text: string } | null>(null);
  const [problem, setProblem] = useState('');
  const run = async (style: Style) => {
    setBusy(style);
    setProblem('');
    try {
      setResult({ style, text: await explain(unitId, style) });
    } catch (e) {
      setProblem(
        e instanceof ApiError
          ? e.message
          : "Allegro's AI isn't available right now. Please try again later.",
      );
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="mt-6">
      {!open ? (
        <Button variant="ask" onClick={() => setOpen(true)}>
          Explain this differently
        </Button>
      ) : (
        <div>
          <p className="text-[15px] font-bold">How would you like it explained?</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {(Object.keys(STYLE_LABEL) as Style[]).map((st) => (
              <Button key={st} variant="ask" onClick={() => void run(st)} disabled={busy !== null}>
                {busy === st ? 'Thinking…' : STYLE_LABEL[st]}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div aria-live="polite">
        {problem && <p className="mt-3 max-w-prose">{problem}</p>}
        {result && (
          <div className="mt-4 max-w-prose">
            <AIBlock label="AI" title={STYLE_LABEL[result.style]} headingLevel={2}>
              <MathText>{result.text}</MathText>
            </AIBlock>
          </div>
        )}
      </div>
    </div>
  );
}

function buildPages(
  u: MicroUnit,
  extras: { onCheck: (ok: boolean) => void; tomorrow: ReactNode; reflect: ReactNode },
): Page[] {
  const pages: Page[] = [
    {
      key: 'hook',
      label: 'Why it matters',
      body: <MathText className="text-[19px]">{u.hook}</MathText>,
    },
    {
      key: 'core',
      label: 'The core idea',
      body: (
        <>
          <MathText>{u.coreIdeaMd}</MathText>
          <ExplainDifferently unitId={u.id} />
        </>
      ),
    },
  ];
  if (u.workedExampleMd)
    pages.push({
      key: 'worked',
      label: 'Worked example',
      body: <MathText>{u.workedExampleMd}</MathText>,
    });
  const mis = u.misconceptionIds.map(misconceptionById).filter(Boolean);
  if (mis.length)
    pages.push({
      key: 'misconception',
      label: 'A common mistake',
      body: (
        <div className="max-w-prose">
          {mis.map((m) => (
            <div key={m!.id} className="mb-5">
              <p className="font-margin text-[24px] text-plum-500">
                &ldquo;{m!.studentSays}&rdquo;
              </p>
              <h3 className="mt-3 font-bold">Why it happens</h3>
              <p>{m!.whyItHappens}</p>
              <h3 className="mt-3 font-bold">How to respond</h3>
              <p>{m!.howToRespond}</p>
              <h3 className="mt-3 font-bold">A question to find it</h3>
              <p>{m!.diagnosticQuestion}</p>
            </div>
          ))}
        </div>
      ),
    });
  pages.push({
    key: 'check',
    label: 'Quick check',
    body: (
      <div>
        {u.checkItems.map((c) => (
          <Check key={c.id} item={c} onAnswered={extras.onCheck} />
        ))}
      </div>
    ),
  });
  pages.push({ key: 'tomorrow', label: 'Try it tomorrow', body: extras.tomorrow });
  pages.push({ key: 'reflect', label: 'Reflect', body: extras.reflect });
  return pages;
}

export default function Learn() {
  const { unitId = '' } = useParams();
  const navigate = useNavigate();
  const mode = useAppStore((s) => s.mode);
  const saved = useAppStore((s) => s.progress[unitId]);
  const saveProgress = useAppStore((s) => s.saveProgress);
  const addLessonMove = useAppStore((s) => s.addLessonMove);
  const added = useAppStore((s) => s.lessonMoves.some((m) => m.unitId === unitId));
  const [page, setPage] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [reflection, setReflection] = useState(saved?.reflection ?? '');
  const unit = unitById(unitId);

  if (mode === 'anonymous') return <Navigate to="/demo" replace />;
  if (!unit)
    return (
      <AppShell step={4}>
        <MarginLayout>
          <h1 className="text-[30px] leading-tight">We couldn&apos;t find that unit</h1>
          <p className="mt-4">
            <Link to="/pathway" className="font-bold text-green-700 underline">
              Back to this week
            </Link>
          </p>
        </MarginLayout>
      </AppShell>
    );

  const names = findLikelyStudentNames(reflection);
  const pages = buildPages(unit, {
    onCheck: (ok) => ok && setCorrect((c) => c + 1),
    tomorrow: (
      <div className="max-w-prose">
        <MathText className="text-[19px]">{unit.tryTomorrow}</MathText>
        <Button
          variant="secondary"
          className="mt-5"
          onClick={() => addLessonMove({ unitId: unit.id, text: unit.tryTomorrow })}
          disabled={added}
        >
          {added ? 'Added to my lesson' : 'Add to my lesson'}
        </Button>
        {added && (
          <p className="mt-2 text-[15px] text-muted">
            Saved. It will be offered when you plan your next lesson.
          </p>
        )}
      </div>
    ),
    reflect: (
      <div className="max-w-prose">
        <label htmlFor="reflection" className="block text-[17px]">
          <MathText inline>{unit.reflectPrompt}</MathText>
        </label>
        <textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded border-2 border-ink bg-field p-3 text-[17px] text-ink"
          aria-describedby="reflection-hint"
        />
        <p id="reflection-hint" className="mt-1 text-[13px] text-muted">
          Optional. Stays on this device. Please don&apos;t include student names.
        </p>
        {names.length > 0 && (
          <p className="mt-2 font-bold" role="alert">
            This looks like it might include a student&apos;s name ({names.join(', ')}). Please
            remove it before you finish.
          </p>
        )}
      </div>
    ),
  });
  const current = pages[page]!;
  const last = page === pages.length - 1;

  const finish = () => {
    const p = {
      completedAt: new Date().toISOString(),
      checkCorrect: correct,
      reflection: reflection.trim(),
    };
    saveProgress(unit.id, p);
    void saveUnitProgress(unit.id, p).catch(() => undefined);
    navigate('/pathway');
  };

  return (
    <AppShell step={4}>
      <MarginLayout grid>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>
            Page {page + 1} of {pages.length} · {DOMAIN_LABELS[unit.domain]} ·{' '}
            {unit.durationMinutes} min
          </Label>
          <DraftBadge reviewedBy={unit.reviewedBy} />
        </div>
        <div
          className="mt-2 h-1.5 w-full bg-sage-100"
          role="progressbar"
          aria-label="Progress through this unit"
          aria-valuemin={1}
          aria-valuemax={pages.length}
          aria-valuenow={page + 1}
        >
          <div
            className="h-full bg-green-700 transition-[width]"
            style={{ width: `${((page + 1) / pages.length) * 100}%` }}
          />
        </div>
        <p className="mt-4 text-[15px] text-muted">
          <MathText inline>{unit.title}</MathText>
        </p>
        <h1 className="mt-1 text-[30px] leading-tight">{current.label}</h1>
        <div className="mt-4" key={current.key}>
          {current.body}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {page > 0 && (
            <Button variant="secondary" onClick={() => setPage(page - 1)}>
              <span aria-hidden="true">←</span> Back
            </Button>
          )}
          {last ? (
            <Button onClick={finish} disabled={names.length > 0}>
              Finish and back to my week
            </Button>
          ) : (
            <Button onClick={() => setPage(page + 1)}>
              Next <span aria-hidden="true">→</span>
            </Button>
          )}
        </div>
        <p className="mt-4">
          <Link to="/pathway" className="text-green-700 underline">
            Back to this week
          </Link>
        </p>
      </MarginLayout>
    </AppShell>
  );
}

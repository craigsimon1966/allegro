import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  FileDown,
  FileText,
  Pencil,
  Presentation,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label } from '@/components/Label';
import { Button } from '@/components/Button';
import { MathText } from '@/components/MathText';
import { MathTextarea } from '@/components/MathTextarea';
import { MarginNote } from '@/components/MarginNote';
import { AI_DISCLOSURE } from '@/components/AIBlock';
import { blockMinutes } from '@shared/lesson';
import { tagById } from '@shared/tags';
import { builtForLine, curriculumRows } from '@shared/curriculum';
import { ROLE_SHORT } from '@shared/profile';
import { CurriculumCodes } from '@/components/CurriculumCodes';
import { useTeacherProfile } from '@/lib/useTeacherProfile';
import { UNITS } from '@shared/catalogue';
import type { LessonBlock, LessonPack } from '@shared/schemas';
import { lessonNumberIssues, type NumberIssue } from '@shared/numberChecks';
import {
  ApiError,
  draftLessonPack,
  loadLessonsFromSupabase,
  redoBlock,
  saveLesson,
} from '@/lib/api';
import { useAppStore, type SavedLesson } from '@/lib/store';
import { Thumbs } from '@/features/feedback/Thumbs';

// Lesson plan editor (SPEC 7.7): reorder, edit, redo one block, check the maths, print.

const linkBtn =
  'inline-flex min-h-tap items-center gap-1.5 font-bold text-plum-700 underline disabled:opacity-40';

function toMarkdown(s: SavedLesson, state?: string): string {
  const l = s.lesson;
  return [
    `# ${l.title}`,
    `Year ${l.year_level}, ${l.duration_minutes} minutes`,
    curriculumRows(l.curriculum_refs, state, [l.year_level])
      .map((r) => `${r.label}: ${r.codes.map((c) => `${c.code} (${c.text})`).join('; ')}.`)
      .join(' '),
    ...l.blocks.map((b) => `## ${b.title}\n\n${b.content_md}\n\n_Why this works: ${b.rationale}_`),
    AI_DISCLOSURE,
  ].join('\n\n');
}

function BlockView({
  block,
  minutes,
  index,
  count,
  checked,
  onCheck,
  onMove,
  onSave,
  onRedo,
  onActive,
  numberIssues = [],
}: {
  block: LessonBlock;
  /** Numbers that could confuse students (shared/numberChecks.ts). Shown on screen, not printed. */
  numberIssues?: NumberIssue[];
  minutes: number;
  index: number;
  count: number;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onMove: (dir: -1 | 1) => void;
  onSave: (content: string) => void;
  onRedo: (instruction: string) => Promise<void>;
  /** The teacher is looking at or working in this block (for the laptop side panel). */
  onActive: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.content_md);
  const [redoing, setRedoing] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const ai = block.source === 'ai_draft';
  const id = `block-${block.id}`;

  const redo = async () => {
    setBusy(true);
    setProblem('');
    try {
      await onRedo(instruction.trim());
      setRedoing(false);
      setInstruction('');
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : "Allegro couldn't redo that block right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby={id}
      data-block-id={block.id}
      onFocusCapture={onActive}
      onMouseEnter={onActive}
      className={`lesson-block relative border-b border-rule py-4 ${ai ? 'bg-plum-100' : ''} -ml-content pl-content pr-5`}
    >
      <div className="absolute left-0 top-4 w-margin text-center">
        <MarginNote tone="green" size={20}>
          {minutes}m
        </MarginNote>
      </div>
      <div className="block-label text-[13px] font-bold tracking-[0.1em] text-plum-700">
        {ai ? 'AI DRAFT' : 'FROM THE MISCONCEPTION BANK'}
      </div>
      <h2 id={id} className="mt-1 text-[20px] font-semibold">
        {block.title}
      </h2>
      {editing ? (
        <div className="no-print mt-2">
          <label htmlFor={`${id}-edit`} className="sr-only">
            Edit {block.title}
          </label>
          <MathTextarea
            id={`${id}-edit`}
            value={draft}
            onChange={setDraft}
            rows={10}
            className="w-full rounded border-2 border-ink bg-field p-3 font-mono text-[15px] text-ink"
          />
          <div className="mt-2 flex gap-3">
            <Button
              onClick={() => {
                onSave(draft);
                setEditing(false);
              }}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(block.content_md);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <MathText className="mt-2">{block.content_md}</MathText>
      )}
      {!editing && numberIssues.length > 0 && (
        <div className="number-check no-print mt-3 max-w-prose border-l-2 border-warning pl-3 text-[15px]">
          <p className="font-bold">Number check</p>
          <ul className="list-disc pl-5">
            {numberIssues.map((i) => (
              <li key={i.message}>{i.message}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="rationale mt-3 max-w-prose text-[15px] text-muted">
        <span className="font-bold">Why this works: </span>
        {block.rationale}
      </p>

      {block.needs_maths_check && (
        <label
          className={`no-print mt-3 flex min-h-tap items-center gap-2 font-bold ${checked ? 'text-green-700' : 'text-ink'}`}
        >
          <input
            type="checkbox"
            className="h-5 w-5 accent-green-700"
            checked={checked}
            onChange={(e) => onCheck(e.target.checked)}
          />
          {checked ? 'Maths checked' : "Check the maths, then tick: I've checked this"}
        </label>
      )}

      <div className="no-print mt-2 flex flex-wrap items-center gap-x-5">
        {!editing && (
          <button
            type="button"
            className={linkBtn}
            onClick={() => setEditing(true)}
            aria-label={`Edit ${block.title}`}
          >
            <Pencil size={18} strokeWidth={1.5} aria-hidden="true" /> Edit
          </button>
        )}
        {!redoing && (
          <button
            type="button"
            className={linkBtn}
            onClick={() => setRedoing(true)}
            aria-label={`Redo this block: ${block.title}`}
          >
            <RefreshCw size={18} strokeWidth={1.5} aria-hidden="true" /> Redo this block
          </button>
        )}
        <button
          type="button"
          className="inline-flex h-tap w-tap items-center justify-center text-ink disabled:opacity-30"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label={`Move ${block.title} up`}
        >
          <ChevronUp size={22} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="inline-flex h-tap w-tap items-center justify-center text-ink disabled:opacity-30"
          onClick={() => onMove(1)}
          disabled={index === count - 1}
          aria-label={`Move ${block.title} down`}
        >
          <ChevronDown size={22} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {redoing && (
        <div className="no-print mt-2 max-w-prose">
          {block.type === 'misconceptions' ? (
            <p className="text-[15px]">
              This block always comes from Allegro&apos;s misconception bank, so redoing it restores
              the original.
            </p>
          ) : (
            <>
              <label htmlFor={`${id}-instr`} className="block text-[15px] font-bold">
                What should change? (optional)
              </label>
              <input
                id={`${id}-instr`}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="For example: easier numbers, or a sport context"
                maxLength={300}
                className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
              />
            </>
          )}
          <div className="mt-2 flex gap-3">
            <Button variant="ask" onClick={() => void redo()} disabled={busy}>
              {busy ? 'Redoing…' : 'Redo'}
            </Button>
            <Button variant="secondary" onClick={() => setRedoing(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
          {problem && (
            <p role="alert" className="mt-2 font-bold">
              {problem}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default function LessonView() {
  const { lessonId = '' } = useParams();
  const mode = useAppStore((s) => s.mode);
  const saved = useAppStore((s) => s.lessons[lessonId]);
  const profile = useTeacherProfile();
  const state = profile.state ?? undefined;
  const updateLesson = useAppStore((s) => s.updateLesson);
  const [loading, setLoading] = useState(mode === 'signed_in' && !saved);
  const [packState, setPackState] = useState<'idle' | 'drafting' | 'building' | 'failed'>('idle');
  /** What was built from the lesson text because the AI could not draft it, if anything. */
  const [plainPack, setPlainPack] = useState<'all' | 'guide' | 'slides' | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const blockCount = saved?.lesson.blocks.length ?? 0;

  // On laptop, the side panel follows the block in the upper part of the screen as the teacher scrolls.
  useEffect(() => {
    if (!blockCount || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        const bid = hit?.target.getAttribute('data-block-id');
        if (bid) setActiveId(bid);
      },
      { rootMargin: '-25% 0px -65% 0px' },
    );
    document.querySelectorAll('[data-block-id]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [blockCount]);

  useEffect(() => {
    if (!loading) return;
    void loadLessonsFromSupabase()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [loading]);

  if (mode === 'anonymous') return <Navigate to="/demo" replace />;
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <p>Loading your lesson</p>
      </div>
    );
  if (!saved)
    return (
      <AppShell step={5}>
        <MarginLayout>
          <h1 className="text-[30px] leading-tight">We couldn&apos;t find that lesson</h1>
          <p className="mt-4">
            <Link to="/plan" className="font-bold text-green-700 underline">
              Plan a lesson
            </Link>
          </p>
        </MarginLayout>
      </AppShell>
    );

  const { lesson } = saved;
  const minutes = blockMinutes(lesson);
  const toCheck = lesson.blocks.filter((b) => b.needs_maths_check);
  const unchecked = toCheck.filter((b) => !saved.checked.includes(b.id)).length;
  const numberIssues = lessonNumberIssues(lesson.blocks);

  const change = (fn: (s: SavedLesson) => SavedLesson) => {
    updateLesson(lessonId, fn);
    const next = useAppStore.getState().lessons[lessonId];
    if (next) void saveLesson(next).catch(() => undefined);
  };
  const setBlock = (id: string, b: LessonBlock) =>
    change((s) => ({
      ...s,
      lesson: { ...s.lesson, blocks: s.lesson.blocks.map((x) => (x.id === id ? b : x)) },
    }));
  const move = (i: number, dir: -1 | 1) =>
    change((s) => {
      const blocks = [...s.lesson.blocks];
      const j = i + dir;
      if (j < 0 || j >= blocks.length) return s;
      [blocks[i], blocks[j]] = [blocks[j]!, blocks[i]!];
      return { ...s, lesson: { ...s.lesson, blocks } };
    });
  const setChecked = (id: string, v: boolean) =>
    change((s) => ({
      ...s,
      checked: v ? [...new Set([...s.checked, id])] : s.checked.filter((x) => x !== id),
    }));

  /** The pack for this version of the lesson: saved, the demo's, freshly drafted, or plain. */
  const getPack = async (): Promise<LessonPack> => {
    const lp = await import('@shared/lessonPack');
    const key = lp.lessonKey(saved.lesson);
    if (saved.pack?.key === key) return saved.pack.pack;
    if (key === lp.DEMO_LESSON_KEY) return lp.DEMO_PACK;
    setPackState('drafting');
    try {
      const pack = await draftLessonPack(saved.lesson);
      // A pack with a plain half is not kept, so the next download asks the AI again.
      if (pack.plain?.length) setPlainPack(pack.plain.length > 1 ? 'all' : pack.plain[0]!);
      else {
        change((s) => ({ ...s, pack: { key, pack } }));
        setPlainPack(null);
      }
      return pack;
    } catch {
      setPlainPack('all');
      return lp.fallbackPack(saved.lesson);
    }
  };

  const download = async (part: 'guide' | 'worksheets' | 'slides' | 'all') => {
    if (packState === 'drafting' || packState === 'building') return;
    try {
      const pack = await getPack();
      setPackState('building');
      const { downloadPack } = await import('@/lib/lessonPackFiles');
      await downloadPack(part, saved.lesson, pack, AI_DISCLOSURE, state);
      setPackState('idle');
    } catch {
      setPackState('failed');
    }
  };
  const packBusy = packState === 'drafting' || packState === 'building';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(saved, state));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AppShell step={5}>
      <div className="lesson-wrap lg:flex print:block">
        <MarginLayout className="lg:min-w-0 lg:flex-1">
          <div className="lesson-print">
            <Label>
              {tagById(saved.inputs.topicTag)?.label ?? 'Lesson'} · Year {lesson.year_level} ·{' '}
              {lesson.duration_minutes} min
            </Label>
            <h1 className="mt-1 text-[30px] leading-tight">{lesson.title}</h1>
            <p className="mt-1 text-[15px] print:hidden" data-testid="built-for">
              <span className="font-bold text-plum-700">Built for:</span>{' '}
              {builtForLine({
                years: [lesson.year_level],
                state,
                role: profile.role ? ROLE_SHORT[profile.role] : null,
              })}
            </p>
            <CurriculumCodes
              refs={lesson.curriculum_refs}
              state={state}
              years={[lesson.year_level]}
              className="mt-2"
            />
            <p className="mt-2 text-sm text-plum-700">{AI_DISCLOSURE}</p>

            <div
              className={`no-print -ml-content mt-4 border-y-2 py-3 pl-content pr-5 ${
                unchecked ? 'border-warning' : 'border-green-700'
              }`}
              role="status"
            >
              {unchecked ? (
                <p className="font-bold">
                  Check the maths: {unchecked} of {toCheck.length} blocks still to check before you
                  teach this.
                </p>
              ) : (
                <p className="font-bold text-green-700">
                  You&apos;ve checked the maths in every block.
                </p>
              )}
            </div>

            {saved.inputs.carryIn && saved.inputs.carryIn.length > 0 && (
              <div className="mt-4 max-w-prose">
                <h2 className="text-[17px] font-bold">Moves you planned to try</h2>
                <ul className="mt-1 list-disc pl-5">
                  {saved.inputs.carryIn.map((m) => (
                    <li key={m}>
                      <MathText inline>{m}</MathText>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4">
              {lesson.blocks.map((b, i) => (
                <BlockView
                  key={b.id}
                  block={b}
                  minutes={minutes[i] ?? 0}
                  index={i}
                  count={lesson.blocks.length}
                  checked={saved.checked.includes(b.id)}
                  onCheck={(v) => setChecked(b.id, v)}
                  onMove={(dir) => move(i, dir)}
                  onSave={(content) => setBlock(b.id, { ...b, content_md: content })}
                  onActive={() => setActiveId(b.id)}
                  numberIssues={numberIssues[b.id]}
                  onRedo={async (instruction) => {
                    const nb = await redoBlock(lesson, saved.inputs.topicTag, b.id, instruction);
                    setBlock(b.id, nb);
                    setChecked(b.id, false);
                  }}
                />
              ))}
            </div>
          </div>

          <section
            aria-labelledby="pack-heading"
            className="no-print -ml-content mt-6 border-t-2 border-rule-strong pl-content pt-4"
          >
            <h2 id="pack-heading" className="text-[22px] leading-tight text-plum-700">
              Download for your class
            </h2>
            <ul className="mt-2 max-w-prose list-disc pl-5 text-[15px]">
              <li>
                <strong>Teacher guide</strong> (Word): step by step, with timings, what to say and
                ask, what to watch for, and the answer key.
              </li>
              <li>
                <strong>Student worksheets</strong> (Word): no answers, space to work, one for each
                level, plus exit ticket slips.
              </li>
              <li>
                <strong>Smart board slides</strong> (PowerPoint): one idea per slide, large type and
                blank space. The slides show no answers, so you write the working live with the
                board pen.
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button disabled={packBusy} onClick={() => void download('all')}>
                <FileDown size={18} strokeWidth={1.5} aria-hidden="true" />
                Download lesson pack (.zip)
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5">
              <button
                type="button"
                className={linkBtn}
                disabled={packBusy}
                onClick={() => void download('guide')}
              >
                <FileText size={18} strokeWidth={1.5} aria-hidden="true" /> Teacher guide
              </button>
              <button
                type="button"
                className={linkBtn}
                disabled={packBusy}
                onClick={() => void download('worksheets')}
              >
                <FileText size={18} strokeWidth={1.5} aria-hidden="true" /> Student worksheets
              </button>
              <button
                type="button"
                className={linkBtn}
                disabled={packBusy}
                onClick={() => void download('slides')}
              >
                <Presentation size={18} strokeWidth={1.5} aria-hidden="true" /> Smart board slides
              </button>
            </div>
            <div role="status" className="mt-2 text-[15px]">
              {packState === 'drafting' && (
                <p className="font-bold">
                  Allegro is drafting the worksheets and slides. This usually takes about a minute.
                </p>
              )}
              {packState === 'building' && <p className="font-bold">Preparing your files…</p>}
              {plainPack && packState !== 'drafting' && (
                <p>
                  {plainPack === 'slides'
                    ? 'Allegro’s AI couldn’t draft the slides this time, so they were built straight from the lesson plan and are plainer.'
                    : plainPack === 'guide'
                      ? 'Allegro’s AI couldn’t draft the teacher steps and worksheets this time, so they were built straight from the lesson plan and are plainer.'
                      : 'Allegro’s AI wasn’t available, so these files were built straight from the lesson plan and are plainer.'}{' '}
                  Download again for the full pack.
                </p>
              )}
            </div>
            {packState === 'failed' && (
              <p role="alert" className="mt-2 font-bold">
                We couldn&apos;t make the files. Please try again, or use Print or Copy as text.
              </p>
            )}
            <p className="mt-2 text-[13px] text-muted">
              Word files open in Microsoft Word and Google Docs. The slides open in PowerPoint,
              Google Slides (File, then Import slides) and smart board software that opens
              PowerPoint. Please check the maths before you use them.
            </p>
          </section>

          <div className="no-print mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={18} strokeWidth={1.5} aria-hidden="true" /> Print or save as PDF
            </Button>
            <Button variant="secondary" onClick={() => void copy()}>
              <Copy size={18} strokeWidth={1.5} aria-hidden="true" />
              {copied ? 'Copied' : 'Copy as text'}
            </Button>
          </div>
          <Thumbs target="lesson" label="Would you use this lesson with minor edits?" />
          <p className="no-print mt-4">
            <Link to="/reflect" className="font-bold text-green-700 underline">
              After you teach it: reflect
            </Link>
            {' · '}
            <Link to="/plan" className="text-green-700 underline">
              Back to the lesson builder
            </Link>
            {' · '}
            <Link to="/pathway" className="text-green-700 underline">
              Back to this week
            </Link>
          </p>
        </MarginLayout>
        <WhyThisBlock
          block={lesson.blocks.find((b) => b.id === activeId) ?? lesson.blocks[0]}
          topicTag={saved.inputs.topicTag}
        />
      </div>
    </AppShell>
  );
}

/** Laptop only: "Why this block works" docks on the right of a lesson (SPEC 10.6, design/Desktop-Lesson). */
function WhyThisBlock({ block, topicTag }: { block?: LessonBlock; topicTag: string }) {
  const related = UNITS.filter((u) => u.tags.includes(topicTag)).slice(0, 3);
  return (
    <aside
      aria-label="Why this works"
      className="no-print sticky top-0 hidden h-screen w-[320px] shrink-0 overflow-y-auto border-l-2 border-rule-strong px-5 py-6 lg:block"
    >
      <Label className="block border-b-2 border-rule-strong pb-1.5">Why this block works</Label>
      {block && (
        <div aria-live="polite">
          <p className="mt-3 font-bold">
            <MathText inline>{block.title}</MathText>
          </p>
          <MathText className="mt-1 text-[15px]">{block.rationale}</MathText>
        </div>
      )}
      {related.length > 0 && (
        <>
          <Label className="mt-6 block border-b border-rule pb-1.5">From your learning</Label>
          <ul>
            {related.map((u) => (
              <li key={u.id} className="border-b border-rule">
                <Link
                  to={`/learn/${u.id}`}
                  className="flex min-h-tap items-center py-2 text-[15px] text-green-700 underline"
                >
                  <MathText inline>{u.title}</MathText>
                  &nbsp;· {u.durationMinutes} min
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}

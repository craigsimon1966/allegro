import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { Button } from '@/components/Button';
import { AIProgress } from '@/components/AIProgress';
import { TAGS, tagById } from '@shared/tags';
import { DEMO_LESSON } from '@shared/lesson';
import { findLikelyStudentNames } from '@shared/pii';
import { ApiError, draftLesson, loadLessonsFromSupabase, saveLesson } from '@/lib/api';
import { useAppStore, type SavedLesson } from '@/lib/store';

// Lesson Builder inputs (SPEC 7.7).

const LESSON_TAGS = TAGS.filter((t) => t.domain === 'CK' || t.domain === 'PCK');
const LENGTHS = [30, 45, 50, 60, 75, 90];
const field = 'w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink';

export default function PlanForm() {
  const navigate = useNavigate();
  const mode = useAppStore((s) => s.mode);
  const personaId = useAppStore((s) => s.personaId);
  const diagnosis = useAppStore((s) => s.diagnosis);
  const needs = useAppStore((s) => s.needs);
  const moves = useAppStore((s) => s.lessonMoves);
  const lessons = useAppStore((s) => s.lessons);
  const putLesson = useAppStore((s) => s.putLesson);
  const state = useAppStore((s) => s.intake?.guided.state);

  const needTag = needs
    .filter((n) => n.status === 'active')
    .flatMap((n) => n.catalogue_tags)
    .find((t) => LESSON_TAGS.some((x) => x.id === t && x.domain === 'CK'));
  const [topicTag, setTopicTag] = useState(needTag ?? 'algebra.linear');
  const [yearLevel, setYearLevel] = useState(diagnosis?.context.year_levels[0] ?? '8');
  const [duration, setDuration] = useState(60);
  const [classProfile, setClassProfile] = useState('');
  const [lastLesson, setLastLesson] = useState('');
  const [carry, setCarry] = useState<string[]>(moves.map((m) => m.text));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    if (mode === 'signed_in') void loadLessonsFromSupabase().catch(() => undefined);
  }, [mode]);

  if (mode === 'anonymous') return <Navigate to="/demo" replace />;

  const names = findLikelyStudentNames([classProfile, lastLesson].join('\n'));
  const inputs = {
    topicTag,
    yearLevel,
    durationMinutes: duration,
    classProfile: classProfile.trim(),
    ...(lastLesson.trim() ? { lastLesson: lastLesson.trim() } : {}),
    ...(carry.length ? { carryIn: carry } : {}),
    ...(state ? { state } : {}),
  };
  const useCached =
    personaId === 'tammy' &&
    topicTag === DEMO_LESSON.topicTag &&
    yearLevel === DEMO_LESSON.yearLevel &&
    duration === DEMO_LESSON.lesson.duration_minutes;

  const open = (lesson: SavedLesson['lesson']) => {
    const saved: SavedLesson = { lesson, inputs, checked: [], updatedAt: new Date().toISOString() };
    putLesson(saved);
    void saveLesson(saved).catch(() => undefined);
    navigate(`/plan/${lesson.lesson_id}`);
  };

  const submit = async () => {
    setProblem('');
    if (useCached) {
      // Demo teacher: the ready-made lesson, no AI call, so the demo works even if the AI is down.
      open({ ...DEMO_LESSON.lesson, lesson_id: `demo-${Date.now()}` });
      return;
    }
    setBusy(true);
    try {
      open(await draftLesson(inputs));
    } catch (e) {
      setProblem(
        e instanceof ApiError
          ? e.message
          : "Allegro's AI isn't available right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const saved = Object.values(lessons).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <AppShell step={5}>
      <MarginLayout>
        <Label>Lesson builder</Label>
        <h1 className="mt-1 text-[30px] leading-tight">Plan a lesson</h1>
        <p className="mt-2 max-w-prose text-muted">
          Allegro drafts a full lesson you can edit, check and print. Describe your class in general
          terms only, with no student names.
        </p>

        {busy ? (
          <div className="mt-10">
            <AIProgress
              title="Drafting your lesson"
              steps={[
                'Reading your class and topic',
                'Planning the explicit teaching',
                'Writing worked examples and practice',
                'Checking common misconceptions',
              ]}
              expectedSeconds={60}
            />
          </div>
        ) : (
          <form
            className="mt-6 flex max-w-prose flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div>
              <label htmlFor="topic" className="block text-[15px] font-bold">
                Topic
              </label>
              <select
                id="topic"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                className={`${field} h-12`}
              >
                {LESSON_TAGS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-5">
              <div className="w-32">
                <label htmlFor="year" className="block text-[15px] font-bold">
                  Year level
                </label>
                <select
                  id="year"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className={`${field} h-12`}
                >
                  {['F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((y) => (
                    <option key={y} value={y}>
                      {y === 'F' ? 'Foundation' : `Year ${y}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label htmlFor="length" className="block text-[15px] font-bold">
                  Lesson length
                </label>
                <select
                  id="length"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className={`${field} h-12`}
                >
                  {LENGTHS.map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="profile" className="block text-[15px] font-bold">
                Your class, in general terms (optional)
              </label>
              <input
                id="profile"
                value={classProfile}
                onChange={(e) => setClassProfile(e.target.value)}
                placeholder="For example: mixed readiness, some EAL/D learners"
                className={`${field} h-12`}
                maxLength={300}
              />
            </div>
            <div>
              <label htmlFor="last" className="block text-[15px] font-bold">
                What you covered last lesson (optional)
              </label>
              <input
                id="last"
                value={lastLesson}
                onChange={(e) => setLastLesson(e.target.value)}
                className={`${field} h-12`}
                maxLength={300}
              />
            </div>
            {moves.length > 0 && (
              <fieldset>
                <legend className="text-[15px] font-bold">
                  Moves from your learning to include
                </legend>
                {moves.map((m) => (
                  <label key={m.unitId} className="mt-2 flex min-h-tap items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 shrink-0 accent-green-700"
                      checked={carry.includes(m.text)}
                      onChange={(e) =>
                        setCarry(
                          e.target.checked ? [...carry, m.text] : carry.filter((t) => t !== m.text),
                        )
                      }
                    />
                    <span>{m.text}</span>
                  </label>
                ))}
              </fieldset>
            )}
            {names.length > 0 && (
              <p className="font-bold" role="alert">
                This looks like it might include a student&apos;s name ({names.join(', ')}). Please
                describe the class in general terms only.
              </p>
            )}
            {problem && (
              <p role="alert" className="font-bold">
                {problem}
              </p>
            )}
            <div>
              <Button type="submit" disabled={names.length > 0}>
                Draft my lesson <span aria-hidden="true">→</span>
              </Button>
            </div>
          </form>
        )}

        {saved.length > 0 && (
          <div className="mt-10 max-w-prose">
            <SectionRule>Your lessons</SectionRule>
            <ul>
              {saved.map((l) => (
                <li key={l.lesson.lesson_id} className="border-b border-rule py-3">
                  <Link
                    to={`/plan/${l.lesson.lesson_id}`}
                    className="font-bold text-green-700 underline"
                  >
                    {l.lesson.title}
                  </Link>
                  <div className="text-[13px] text-muted">
                    {tagById(l.inputs.topicTag)?.label ?? ''} · Year {l.lesson.year_level} ·{' '}
                    {l.lesson.duration_minutes} min
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </MarginLayout>
    </AppShell>
  );
}

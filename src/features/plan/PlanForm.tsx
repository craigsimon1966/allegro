import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { Button } from '@/components/Button';
import { AIProgress } from '@/components/AIProgress';
import { tagById } from '@shared/tags';
import { DEMO_LESSON, curriculumRefsFor } from '@shared/lesson';
import {
  PLAN_YEARS,
  isSeniorYear,
  lessonTopicsFor,
  seniorCourseFor,
  topicFitsYear,
  yearLabel,
} from '@shared/curriculum';
import { CurriculumCodes } from '@/components/CurriculumCodes';
import { useTeacherProfile } from '@/lib/useTeacherProfile';
import { findLikelyStudentNames } from '@shared/pii';
import { ApiError, draftLesson, loadLessonsFromSupabase, saveLesson } from '@/lib/api';
import { useAppStore, type SavedLesson } from '@/lib/store';

// Lesson Builder inputs (SPEC 7.7).

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
  const profile = useTeacherProfile();
  const state = profile.state ?? undefined;
  const myYears = profile.years.filter((y) => (PLAN_YEARS as readonly string[]).includes(y));

  // The topic the teacher's needs point to, if it is taught in this year.
  const needTagFor = (year: string) =>
    needs
      .filter((n) => n.status === 'active')
      .flatMap((n) => n.catalogue_tags)
      .find((t) => lessonTopicsFor(year, state).some((x) => x.id === t && x.domain === 'CK'));
  const firstTopic = (year: string) =>
    needTagFor(year) ?? lessonTopicsFor(year, state)[0]?.id ?? '';
  const [yearLevel, setYearLevel] = useState(myYears[0] ?? '8');
  const [topicTag, setTopicTag] = useState(() => firstTopic(myYears[0] ?? '8'));
  const topics = lessonTopicsFor(yearLevel, state);
  const chooseYear = (y: string) => {
    setYearLevel(y);
    if (!topicFitsYear(topicTag, y)) setTopicTag(firstTopic(y));
  };
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
  // The situation summary helps the AI pitch the lesson; it goes only if it has no likely names.
  const situation = (diagnosis?.summary ?? '').slice(0, 600);
  const inputs = {
    topicTag,
    yearLevel,
    durationMinutes: duration,
    classProfile: classProfile.trim(),
    ...(lastLesson.trim() ? { lastLesson: lastLesson.trim() } : {}),
    ...(carry.length ? { carryIn: carry } : {}),
    ...(state ? { state } : {}),
    ...(profile.role ? { role: profile.role } : {}),
    ...(profile.situations.length ? { situations: profile.situations } : {}),
    ...(profile.confidentYears.length ? { confidentYears: profile.confidentYears } : {}),
    ...(profile.newToYears.length ? { newToYears: profile.newToYears } : {}),
    ...(situation && !findLikelyStudentNames(situation).length ? { situation } : {}),
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
            <div className="w-48">
              <label htmlFor="year" className="block text-[15px] font-bold">
                Year level
              </label>
              <select
                id="year"
                value={yearLevel}
                onChange={(e) => chooseYear(e.target.value)}
                className={`${field} h-12`}
              >
                {PLAN_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {yearLabel(y)}
                    {myYears.includes(y) ? ' (your class)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="topic" className="block text-[15px] font-bold">
                Topic for {yearLabel(yearLevel)}
              </label>
              {topics.length ? (
                <select
                  id="topic"
                  value={topicTag}
                  onChange={(e) => setTopicTag(e.target.value)}
                  className={`${field} h-12`}
                >
                  {(['CK', 'PCK'] as const).map((d) => {
                    const list = topics.filter((t) => t.domain === d);
                    return list.length ? (
                      <optgroup
                        key={d}
                        label={d === 'CK' ? 'Maths topics' : 'Teaching a topic well'}
                      >
                        {list.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </optgroup>
                    ) : null;
                  })}
                </select>
              ) : (
                <p id="topic" className="mt-1" role="status">
                  {isSeniorYear(yearLevel) && !seniorCourseFor(state)
                    ? `Allegro has senior lesson topics for NSW, South Australia, the Northern Territory and Tasmania so far. The senior course for your state is coming. Choose another year level.`
                    : `Allegro doesn't have lesson topics for ${yearLabel(yearLevel)} yet. Choose another year level.`}
                </p>
              )}
              {topics.length > 0 && isSeniorYear(yearLevel) && (
                <p className="mt-2 text-[15px]">Course: {seniorCourseFor(state)}</p>
              )}
              {topics.length > 0 && (
                <CurriculumCodes
                  refs={curriculumRefsFor(topicTag, yearLevel)}
                  state={state}
                  years={[yearLevel]}
                  compact
                  className="mt-2"
                />
              )}
            </div>
            <div className="flex flex-wrap gap-5">
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
              <Button type="submit" disabled={names.length > 0 || !topics.length}>
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

import type { Diagnosis, DiagnoseRequest, Lesson, LessonBlock } from '@shared/schemas';
import {
  DiagnosisSchema,
  LessonBlockSchema,
  LessonPackSchema,
  LessonSchema,
  type LessonPack,
} from '@shared/schemas';
import type { LessonRequest } from '@shared/lesson';
import { supabase } from './supabase';
import {
  useAppStore,
  type ReadingPick,
  type Reflection,
  type SavedLesson,
  type TeacherNeed,
  type UnitProgress,
} from './store';
import type { PathwayItem } from '@shared/pathway';
import type { CheckAttempt } from '@shared/quickCheck';
import type { FeedbackRow } from '@/features/admin/feedbackSummary';

// Data layer (TECH_SPEC 9.1). Features call these functions and never branch on mode:
// demo mode reads and writes the local store, signed-in mode also writes to Supabase.

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { mode, demoSessionId } = useAppStore.getState();
  if (mode === 'signed_in' && supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return { authorization: `Bearer ${data.session.access_token}` };
  }
  return demoSessionId ? { 'x-demo-session': demoSessionId } : {};
}

async function post(path: string, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(
      'offline',
      "We couldn't reach Allegro. Check your connection and try again.",
    );
  }
  if (res.status === 204) return null;
  const data = (await res.json().catch(() => null)) as {
    error?: { code: string; message: string } & Record<string, unknown>;
  } | null;
  if (!res.ok || data?.error) {
    const e = data?.error;
    // A missing Functions server in local Vite-only dev shows up as a 404 or 5xx with no body.
    throw new ApiError(
      e?.code ?? 'ai_unavailable',
      e?.message ?? "Allegro's AI isn't available right now.",
      e ?? {},
    );
  }
  return data;
}

/** POST /api/explain: plain text back (TECH_SPEC 7.2). */
export async function explain(
  unitId: string,
  style: 'simpler' | 'different_context',
  context?: string,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ unitId, style, ...(context ? { context } : {}) }),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(
      'offline',
      "We couldn't reach Allegro. Check your connection and try again.",
    );
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: { code: string; message: string };
    } | null;
    throw new ApiError(
      data?.error?.code ?? 'ai_unavailable',
      data?.error?.message ?? "Allegro's AI isn't available right now.",
    );
  }
  const text = (await res.text()).trim();
  if (!text) throw new ApiError('ai_unavailable', "Allegro's AI isn't available right now.");
  return text;
}

export async function diagnose(req: DiagnoseRequest): Promise<Diagnosis> {
  const data = await post('/api/diagnose', req);
  const parsed = DiagnosisSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError('ai_invalid_output', "We couldn't make sense of the AI's reply.");
  return parsed.data;
}

/**
 * POST /api/pathway: the AI's week, already checked on the server (TECH_SPEC 7.3).
 * Returns null if it fails or takes too long, so the caller can use the rules version.
 */
export async function aiPathway(
  req: {
    needs: {
      id: string;
      topic: string;
      evidence: string;
      priority: string;
      catalogue_tags: string[];
    }[];
    hoursPerWeek: number;
    teachingDaysPerWeek: number | null;
    weekStart: string;
    yearLevels: string[];
    state?: string;
    situations?: string[];
    confidentYears?: string[];
    newToYears?: string[];
  },
  timeoutMs = 45000,
): Promise<{ items: PathwayItem[]; external: ReadingPick[] } | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  const call = post('/api/pathway', req)
    .then((data) => {
      const d = data as { items?: PathwayItem[]; external?: ReadingPick[] } | null;
      if (!Array.isArray(d?.items) || !d.items.length) return null;
      return { items: d.items, external: Array.isArray(d.external) ? d.external : [] };
    })
    .catch(() => null);
  return Promise.race([call, timeout]);
}

export async function hasAccessCookie(): Promise<boolean> {
  try {
    const res = await fetch('/api/access', { credentials: 'same-origin' });
    return res.status === 204;
  } catch {
    return false;
  }
}

export async function submitAccessCode(code: string): Promise<void> {
  await post('/api/access', { code });
}

/** Saves the intake and its needs. Demo: local only. Signed in: also Supabase, under RLS. */
export async function saveIntakeAndNeeds(
  situationText: string,
  diagnosis: Diagnosis,
): Promise<void> {
  const { mode } = useAppStore.getState();
  if (mode !== 'signed_in' || !supabase) return;
  const { data: intake, error: intakeErr } = await supabase
    .from('intakes')
    .insert({ situation_text: situationText, diagnosis })
    .select('id')
    .single();
  if (intakeErr)
    throw new ApiError('server_error', 'We could not save your situation. Please try again.');
  const rows = diagnosis.needs.map((n) => ({
    intake_id: intake.id,
    domain: n.domain,
    topic: n.topic,
    tags: n.catalogue_tags,
    evidence: n.evidence,
    priority: n.priority,
  }));
  const { data: saved, error } = await supabase.from('needs').insert(rows).select('id');
  if (error || !saved)
    throw new ApiError('server_error', 'We could not save your needs. Please try again.');
  // Swap the AI's need ids for the database ids so later edits update the right rows.
  useAppStore.setState((s) => ({
    needs: s.needs.map((n, i) => (saved[i] ? { ...n, id: saved[i].id as string } : n)),
  }));
}

/** Persists teacher edits to a need (signed in only; demo edits already live in the store). */
export async function saveNeedEdit(need: TeacherNeed): Promise<void> {
  const { mode } = useAppStore.getState();
  if (mode !== 'signed_in' || !supabase) return;
  await supabase
    .from('needs')
    .update({
      priority: need.priority,
      self_rating: need.selfRating,
      diagnostic_result: need.diagnosticResult,
      status: need.status,
    })
    .eq('id', need.id);
}

/**
 * Signed in on a new device or after a reload: loads the latest intake and its needs from
 * Supabase into the store. Returns false when the teacher has no intake yet.
 */
export async function loadLatestFromSupabase(): Promise<boolean> {
  if (!supabase) return false;
  const { data: intake } = await supabase
    .from('intakes')
    .select('id, situation_text, diagnosis')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!intake) return false;
  const parsed = DiagnosisSchema.safeParse(intake.diagnosis);
  if (!parsed.success) return false;
  const { data: rows } = await supabase
    .from('needs')
    .select('id, domain, topic, tags, evidence, priority, self_rating, diagnostic_result, status')
    .eq('intake_id', intake.id)
    .order('created_at', { ascending: true });
  const store = useAppStore.getState();
  store.setIntake({ situationText: intake.situation_text as string, guided: {} });
  store.setDiagnosis(parsed.data);
  if (rows?.length) {
    useAppStore.setState({
      needs: rows.map((r) => ({
        id: r.id as string,
        domain: r.domain as TeacherNeed['domain'],
        topic: r.topic as string,
        catalogue_tags: (r.tags as string[]) ?? [],
        evidence: (r.evidence as string) ?? '',
        priority: r.priority as TeacherNeed['priority'],
        selfRating: (r.self_rating as number | null) ?? null,
        diagnosticResult: (r.diagnostic_result as TeacherNeed['diagnosticResult']) ?? null,
        status: r.status === 'removed' ? 'removed' : 'active',
      })),
    });
  }
  return true;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Replaces the signed-in teacher's saved week with the current one. Demo: store only. */
export async function savePathway(items: PathwayItem[]): Promise<void> {
  const { mode } = useAppStore.getState();
  if (mode !== 'signed_in' || !supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('pathway_items').delete().eq('user_id', auth.user.id);
  if (!items.length) return;
  await supabase.from('pathway_items').insert(
    items.map((it) => ({
      unit_id: it.unitId,
      need_id: UUID.test(it.needId) ? it.needId : null,
      reason: it.reason,
      scheduled_for: it.scheduledFor,
      sort_order: it.sortOrder,
    })),
  );
}

/** Saves one unit's progress and reflection (signed in only). */
export async function saveUnitProgress(unitId: string, p: UnitProgress): Promise<void> {
  const { mode } = useAppStore.getState();
  if (mode !== 'signed_in' || !supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('unit_progress').upsert({
    user_id: auth.user.id,
    unit_id: unitId,
    started_at: p.completedAt,
    completed_at: p.completedAt,
    check_answers: { correct: p.checkCorrect, attempts: p.attempts ?? {} },
    reflect_note: p.reflection.slice(0, 1000) || null,
  });
}

/** Loads the saved week and unit progress into the store (signed in, new device or reload). */
export async function loadPathwayFromSupabase(key: string, weekStart: string): Promise<void> {
  if (!supabase) return;
  const [{ data: items }, { data: progress }] = await Promise.all([
    supabase
      .from('pathway_items')
      .select('unit_id, need_id, reason, scheduled_for, sort_order')
      .order('sort_order', { ascending: true }),
    supabase.from('unit_progress').select('unit_id, completed_at, check_answers, reflect_note'),
  ]);
  const store = useAppStore.getState();
  if (progress?.length) {
    useAppStore.setState({
      progress: Object.fromEntries(
        progress.map((r) => [
          r.unit_id as string,
          {
            completedAt: (r.completed_at as string | null) ?? null,
            checkCorrect: Number((r.check_answers as { correct?: number } | null)?.correct ?? 0),
            attempts:
              (r.check_answers as { attempts?: Record<string, CheckAttempt> } | null)?.attempts ??
              {},
            reflection: (r.reflect_note as string | null) ?? '',
          },
        ]),
      ),
    });
  }
  // Only reuse a saved week if it is this week; an older one is rebuilt from the needs.
  if (items?.length && (items[0]!.scheduled_for as string) >= weekStart) {
    store.setPathway(
      items.map((r) => ({
        unitId: r.unit_id as string,
        needId: (r.need_id as string | null) ?? '',
        reason: (r.reason as string | null) ?? '',
        scheduledFor: r.scheduled_for as string,
        sortOrder: r.sort_order as number,
      })),
      key,
    );
  }
}

export async function draftLesson(req: LessonRequest): Promise<Lesson> {
  const parsed = LessonSchema.safeParse(await post('/api/lesson', req));
  if (!parsed.success)
    throw new ApiError('ai_invalid_output', "We couldn't make sense of the AI's reply.");
  return parsed.data;
}

export async function redoBlock(
  lesson: Lesson,
  topicTag: string,
  blockId: string,
  instruction?: string,
): Promise<LessonBlock> {
  const parsed = LessonBlockSchema.safeParse(
    await post('/api/lesson-block', {
      lesson,
      topicTag,
      blockId,
      ...(instruction ? { instruction } : {}),
    }),
  );
  if (!parsed.success)
    throw new ApiError('ai_invalid_output', "We couldn't make sense of the AI's reply.");
  return parsed.data;
}

/** Worksheets, teacher steps and smart board slides for a finished lesson. */
export async function draftLessonPack(lesson: Lesson): Promise<LessonPack> {
  const parsed = LessonPackSchema.safeParse(await post('/api/lesson-pack', { lesson }));
  if (!parsed.success)
    throw new ApiError('ai_invalid_output', "We couldn't make sense of the AI's reply.");
  return parsed.data;
}

/** Saves a lesson to the lessons table (signed in only) and remembers its row id. */
export async function saveLesson(saved: SavedLesson): Promise<void> {
  const { mode } = useAppStore.getState();
  if (mode !== 'signed_in' || !supabase) return;
  const row = {
    title: saved.lesson.title,
    topic_tag: saved.inputs.topicTag,
    year_level: saved.lesson.year_level,
    duration_minutes: saved.lesson.duration_minutes,
    inputs: saved.inputs,
    plan: saved.lesson,
    maths_checked: saved.lesson.blocks
      .filter((b) => b.needs_maths_check)
      .every((b) => saved.checked.includes(b.id)),
  };
  if (saved.dbId) {
    await supabase.from('lessons').update(row).eq('id', saved.dbId);
    return;
  }
  const { data } = await supabase.from('lessons').insert(row).select('id').single();
  if (data?.id)
    useAppStore
      .getState()
      .updateLesson(saved.lesson.lesson_id, (l) => ({ ...l, dbId: data.id as string }));
}

/** Loads the signed-in teacher's saved lessons into the store. */
export async function loadLessonsFromSupabase(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase
    .from('lessons')
    .select('id, inputs, plan, maths_checked, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20);
  if (!data?.length) return;
  const lessons = { ...useAppStore.getState().lessons };
  for (const r of data) {
    const plan = LessonSchema.safeParse(r.plan);
    if (!plan.success) continue;
    const existing = Object.values(lessons).find((l) => l.dbId === r.id);
    if (existing) continue;
    lessons[plan.data.lesson_id] = {
      lesson: plan.data,
      inputs: r.inputs as LessonRequest,
      checked: r.maths_checked ? plan.data.blocks.map((b) => b.id) : [],
      dbId: r.id as string,
      updatedAt: r.updated_at as string,
    };
  }
  useAppStore.setState({ lessons });
}

export interface HelpAnswer {
  answer: string;
  tryTomorrow: string;
  detail: string;
  unitId: string | null;
}

export async function askHelp(
  question: string,
  context?: {
    unitId?: string;
    yearLevel?: string;
    yearLevels?: string[];
    role?: string;
    state?: string;
  },
): Promise<HelpAnswer> {
  return (await post('/api/help', { question, ...(context ? { context } : {}) })) as HelpAnswer;
}

export async function reflectOn(
  r: Pick<Reflection, 'tried' | 'happened' | 'nextTime'>,
  needs: { topic: string; tags: string[] }[],
): Promise<{ observation: string; suggestedUnitId: string | null }> {
  return (await post('/api/reflect', { ...r, needs })) as {
    observation: string;
    suggestedUnitId: string | null;
  };
}

/** Saves a reflection and its confidence ratings (signed in only). Private by RLS. */
export async function saveReflection(r: Reflection): Promise<void> {
  const { mode, lessons } = useAppStore.getState();
  if (mode !== 'signed_in' || !supabase) return;
  const dbLessonId = r.lessonId ? (lessons[r.lessonId]?.dbId ?? null) : null;
  await supabase.from('reflections').insert({
    lesson_id: dbLessonId,
    tried: r.tried,
    happened: r.happened,
    next_time: r.nextTime,
    ai_observation: r.observation,
    suggested_unit_id: r.suggestedUnitId,
  });
  const rows = Object.entries(r.ratings)
    .filter(([needId]) => UUID.test(needId))
    .map(([need_id, rating]) => ({ need_id, rating }));
  if (rows.length) await supabase.from('confidence_ratings').insert(rows);
}

/** Anonymous pilot feedback (SPEC 14). Uses a random id per browser session, never the user id. */
function feedbackSession(): string {
  try {
    const k = 'allegro-feedback-session';
    const existing = window.sessionStorage.getItem(k);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(k, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export async function sendFeedback(f: {
  target: string;
  thumbs?: 1 | -1;
  scores?: Record<string, number>;
  comment?: string;
}): Promise<void> {
  await post('/api/feedback', { sessionId: feedbackSession(), ...f });
}

/** POST /api/account/delete (TECH_SPEC 5.3), then sign out and clear everything local. */
export async function deleteAccount(): Promise<void> {
  await post('/api/account/delete', {});
  if (supabase) await supabase.auth.signOut().catch(() => null);
  useAppStore.getState().reset();
}

/**
 * Admin only (TECH_SPEC 9.1): returns null when the signed-in user is not an admin.
 * RLS is the real guard; this check just decides whether to show the page.
 */
export async function loadFeedbackForAdmin(): Promise<FeedbackRow[] | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!profile?.is_admin) return null;
  const { data, error } = await supabase
    .from('feedback')
    .select('id, session_id, target, thumbs, scores, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw new ApiError('server_error', "We couldn't load the feedback.");
  return data as FeedbackRow[];
}

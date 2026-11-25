import type { Diagnosis, DiagnoseRequest } from '@shared/schemas';
import { DiagnosisSchema } from '@shared/schemas';
import { supabase } from './supabase';
import { useAppStore, type TeacherNeed } from './store';

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

export async function diagnose(req: DiagnoseRequest): Promise<Diagnosis> {
  const data = await post('/api/diagnose', req);
  const parsed = DiagnosisSchema.safeParse(data);
  if (!parsed.success)
    throw new ApiError('ai_invalid_output', "We couldn't make sense of the AI's reply.");
  return parsed.data;
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

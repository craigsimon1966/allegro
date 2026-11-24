import type { Env } from './env';
import type { Subject } from './auth';
import { subjectKey } from './auth';

// Rate limits and usage logging (TECH_SPEC 7.1). Counted from ai_calls in Supabase when the
// service role key is set; otherwise an in-memory counter (local dev only, per isolate).

const memory = new Map<string, number[]>();
const HOUR = 60 * 60 * 1000;

export function limitFor(subject: Subject, env: Env): number {
  const raw = subject.kind === 'user' ? env.RATE_LIMIT_USER_PER_HOUR : env.RATE_LIMIT_DEMO_PER_HOUR;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : subject.kind === 'user' ? 40 : 15;
}

const hasDb = (env: Env) => !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

function adminHeaders(env: Env): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
    'content-type': 'application/json',
  };
}

export async function callsInLastHour(
  subject: Subject,
  env: Env,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<number> {
  const key = subjectKey(subject);
  if (!hasDb(env)) return (memory.get(key) ?? []).filter((t) => now - t < HOUR).length;
  const since = new Date(now - HOUR).toISOString();
  const url = `${env.SUPABASE_URL}/rest/v1/ai_calls?select=id&subject=eq.${encodeURIComponent(key)}&created_at=gte.${encodeURIComponent(since)}`;
  const res = await fetchImpl(url, {
    method: 'HEAD',
    headers: { ...adminHeaders(env), prefer: 'count=exact' },
  });
  const range = res.headers.get('content-range'); // e.g. "0-4/5" or "*/0"
  return Number(range?.split('/')[1] ?? 0) || 0;
}

/** Returns seconds to wait, or 0 when the call may go ahead. */
export async function checkRateLimit(
  subject: Subject,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const used = await callsInLastHour(subject, env, fetchImpl);
  return used >= limitFor(subject, env) ? 15 * 60 : 0;
}

/** One row per AI request, never the prompt or response text (TECH_SPEC 5.4). */
export async function logAiCall(
  subject: Subject,
  env: Env,
  row: { endpoint: string; model: string; inputTokens: number; outputTokens: number; ok: boolean },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const key = subjectKey(subject);
  if (!hasDb(env)) {
    memory.set(key, [...(memory.get(key) ?? []), Date.now()]);
    return;
  }
  await fetchImpl(`${env.SUPABASE_URL}/rest/v1/ai_calls`, {
    method: 'POST',
    headers: { ...adminHeaders(env), prefer: 'return=minimal' },
    body: JSON.stringify({
      subject: key,
      endpoint: row.endpoint,
      model: row.model,
      input_tokens: row.inputTokens,
      output_tokens: row.outputTokens,
      ok: row.ok,
    }),
  }).catch(() => undefined);
}

/** Test helper. */
export const resetMemoryLimits = () => memory.clear();

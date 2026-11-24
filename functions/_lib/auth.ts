import type { Env } from './env';

// Who is calling (TECH_SPEC 7.1): a signed-in teacher (Supabase access token) or a demo
// session (random uuid). Neither present means 401.

export type Subject = { kind: 'user'; id: string } | { kind: 'demo'; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function identify(
  request: Request,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<Subject | null> {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
    const res = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, authorization: auth },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string };
    return user.id ? { kind: 'user', id: user.id } : null;
  }
  const demo = request.headers.get('x-demo-session');
  if (demo && UUID.test(demo)) return { kind: 'demo', id: demo };
  return null;
}

/** The value stored in ai_calls.subject: user id or 'demo:<session>'. */
export const subjectKey = (s: Subject) => (s.kind === 'user' ? s.id : `demo:${s.id}`);

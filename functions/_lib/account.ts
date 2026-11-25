import type { Env } from './env';
import { identify } from './auth';
import { error } from './respond';

// POST /api/account/delete (TECH_SPEC 5.3). Verifies the teacher's token, then uses the
// service role to delete the auth user. Every teacher table cascades from auth.users.
// ai_calls has no foreign key (it also logs demo sessions), so its rows are removed here too.

export async function handleAccountDelete(
  request: Request,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const who = await identify(request, env, fetchImpl);
  if (!who || who.kind !== 'user')
    return error('unauthorised', 'Please sign in again, then try deleting your account.');
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    return error(
      'server_error',
      "Account deletion isn't switched on yet. Email us and we'll delete your account by hand.",
    );
  const admin = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const id = encodeURIComponent(who.id);
  // Best effort: a failure here must not stop the account itself being deleted.
  await fetchImpl(`${env.SUPABASE_URL}/rest/v1/ai_calls?subject=eq.${id}`, {
    method: 'DELETE',
    headers: { ...admin, prefer: 'return=minimal' },
  }).catch(() => null);
  const res = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: admin,
  });
  if (!res.ok && res.status !== 404)
    return error('server_error', "We couldn't delete your account just now. Please try again.");
  return new Response(null, { status: 204 });
}

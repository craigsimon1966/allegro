// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handleAccountDelete } from '../../functions/_lib/account';

const USER = '11111111-2222-4333-8444-555555555555';
const req = (headers: Record<string, string> = { authorization: 'Bearer tok' }) =>
  new Request('http://localhost/api/account/delete', { method: 'POST', headers, body: '{}' });
const env = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_ANON_KEY: 'pk',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
};

function fakeFetch(calls: { url: string; method: string; auth?: string }[], userOk = true) {
  return (async (url: string, init: RequestInit = {}) => {
    const h = (init.headers ?? {}) as Record<string, string>;
    calls.push({ url, method: init.method ?? 'GET', auth: h.authorization });
    if (url.endsWith('/auth/v1/user'))
      return userOk
        ? new Response(JSON.stringify({ id: USER }), { status: 200 })
        : new Response('{}', { status: 401 });
    return new Response(null, { status: 200 });
  }) as unknown as typeof fetch;
}

describe('POST /api/account/delete', () => {
  it('deletes the signed-in user with the service role', async () => {
    const calls: { url: string; method: string; auth?: string }[] = [];
    const res = await handleAccountDelete(req(), env, fakeFetch(calls));
    expect(res.status).toBe(204);
    const del = calls.find((c) => c.url.includes('/auth/v1/admin/users/'));
    expect(del?.url).toBe(`https://x.supabase.co/auth/v1/admin/users/${USER}`);
    expect(del?.method).toBe('DELETE');
    expect(del?.auth).toBe('Bearer service');
    // The caller's own token is only used to find out who they are.
    expect(calls[0]?.auth).toBe('Bearer tok');
  });
  it('refuses demo sessions and bad tokens', async () => {
    const calls: { url: string; method: string }[] = [];
    const demo = await handleAccountDelete(req({ 'x-demo-session': USER }), env, fakeFetch(calls));
    expect(demo.status).toBe(401);
    const bad = await handleAccountDelete(req(), env, fakeFetch(calls, false));
    expect(bad.status).toBe(401);
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  });
  it('says so plainly when the service role key is not set', async () => {
    const res = await handleAccountDelete(
      req(),
      { ...env, SUPABASE_SERVICE_ROLE_KEY: undefined },
      fakeFetch([]),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toMatch(/by hand/);
  });
});

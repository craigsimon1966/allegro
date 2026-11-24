import { AccessRequestSchema } from '../../shared/schemas';
import { ACCESS_COOKIE, ACCESS_DAYS, constantTimeEqual, makeAccessToken } from './access';
import type { Env } from './env';
import { error } from './respond';

export async function handleAccess(request: Request, env: Env): Promise<Response> {
  if (!env.DEMO_ACCESS_CODE) return new Response(null, { status: 204 });
  if (!env.ACCESS_COOKIE_SECRET) return error('server_error', 'The access gate is not set up yet.');
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('invalid_input', 'Please enter the access code.');
  }
  const parsed = AccessRequestSchema.safeParse(body);
  if (!parsed.success || !constantTimeEqual(parsed.data.code.trim(), env.DEMO_ACCESS_CODE)) {
    return error('unauthorised', "That code didn't work. Please check it and try again.");
  }
  const token = await makeAccessToken(env.ACCESS_COOKIE_SECRET);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return new Response(null, {
    status: 204,
    headers: {
      'set-cookie': `${ACCESS_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCESS_DAYS * 86400}${secure}`,
    },
  });
}

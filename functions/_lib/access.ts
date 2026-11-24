// Access-code gate (TECH_SPEC 6.2). POST /api/access checks the code and sets a signed,
// http-only cookie for 30 days. When DEMO_ACCESS_CODE is set, every AI endpoint also requires
// the cookie, so the gate can't be bypassed by calling the API directly (spec-issues G8).
import type { Env } from './env';

export const ACCESS_COOKIE = 'allegro_access';
export const ACCESS_DAYS = 30;

const enc = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Compares two strings in time that doesn't depend on where they differ. */
export function constantTimeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export async function makeAccessToken(secret: string, now = Date.now()): Promise<string> {
  const exp = String(now + ACCESS_DAYS * 24 * 60 * 60 * 1000);
  return `${exp}.${await hmac(secret, exp)}`;
}

export async function verifyAccessToken(
  secret: string,
  token: string,
  now = Date.now(),
): Promise<boolean> {
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < now) return false;
  return constantTimeEqual(sig, await hmac(secret, exp));
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

/** True when the gate is off, or the request carries a valid access cookie. */
export async function hasAccess(request: Request, env: Env): Promise<boolean> {
  if (!env.DEMO_ACCESS_CODE) return true;
  if (!env.ACCESS_COOKIE_SECRET) return false;
  const token = readCookie(request, ACCESS_COOKIE);
  return token ? verifyAccessToken(env.ACCESS_COOKIE_SECRET, token) : false;
}

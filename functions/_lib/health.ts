import { UNITS } from '../../shared/catalogue';
import type { Env } from './env';
import { aiCallsSince } from './ratelimit';
import { json } from './respond';

// GET /api/health (TECH_SPEC 7.2, 7.6, 13). Public, so it says only whether each setting is
// present, never its value.

export interface HealthEnv extends Env {
  /** Set by Cloudflare Pages on every deploy. */
  CF_PAGES_COMMIT_SHA?: string;
  CF_PAGES_BRANCH?: string;
}

export interface Health {
  ok: true;
  version: string;
  branch: string | null;
  contentVersion: string;
  /** Null when the service role key is missing, so calls can't be counted. */
  aiCallsLast24h: number | null;
  setup: {
    anthropicKey: boolean;
    supabase: boolean;
    serviceRoleKey: boolean;
    accessCode: boolean;
  };
  /** Rate limits count in Supabase only with the service role key; otherwise per server copy. */
  rateLimits: 'database' | 'memory';
}

/** Short, stable fingerprint of the unit catalogue, so a content change shows up here. */
export function contentVersion(): string {
  const text = JSON.stringify(UNITS);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const reviewed = UNITS.filter((u) => u.reviewedBy).length;
  return `${UNITS.length} units, ${reviewed} reviewed, ${h.toString(16).padStart(8, '0')}`;
}

export async function handleHealth(
  env: HealthEnv,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<Response> {
  const serviceRoleKey = !!env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
  const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const body: Health = {
    ok: true,
    version: env.CF_PAGES_COMMIT_SHA?.slice(0, 7) || 'dev',
    branch: env.CF_PAGES_BRANCH || null,
    contentVersion: contentVersion(),
    aiCallsLast24h: await aiCallsSince(env, since, fetchImpl),
    setup: {
      anthropicKey: !!env.ANTHROPIC_API_KEY,
      supabase,
      serviceRoleKey,
      accessCode: !!env.DEMO_ACCESS_CODE,
    },
    rateLimits: serviceRoleKey && env.SUPABASE_URL ? 'database' : 'memory',
  };
  return json(body, { headers: { 'cache-control': 'no-store' } });
}

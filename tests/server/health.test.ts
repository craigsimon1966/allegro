// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handleHealth, type Health } from '../../functions/_lib/health';

describe('GET /api/health', () => {
  it('says which settings are present without showing any value', async () => {
    const env = {
      ANTHROPIC_API_KEY: 'sk-secret-value',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_ANON_KEY: 'pk',
      CF_PAGES_COMMIT_SHA: 'abcdef1234567',
      CF_PAGES_BRANCH: 'main',
    };
    const res = await handleHealth(env);
    const text = await res.text();
    expect(text).not.toContain('sk-secret-value');
    const h = JSON.parse(text) as Health;
    expect(h.version).toBe('abcdef1');
    expect(h.branch).toBe('main');
    expect(h.setup).toEqual({
      anthropicKey: true,
      supabase: true,
      serviceRoleKey: false,
      accessCode: false,
    });
    expect(h.rateLimits).toBe('memory');
    expect(h.aiCallsLast24h).toBeNull();
    expect(h.contentVersion).toMatch(/^\d+ units, 0 reviewed, [0-9a-f]{8}$/);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('counts AI calls in the last 24 hours with the service role key', async () => {
    let url = '';
    const fetchImpl = (async (u: string) => {
      url = u;
      return new Response(null, { status: 200, headers: { 'content-range': '*/42' } });
    }) as unknown as typeof fetch;
    const now = Date.parse('2026-11-25T12:00:00Z');
    const res = await handleHealth(
      { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srk' },
      fetchImpl,
      now,
    );
    const h = (await res.json()) as Health;
    expect(h.aiCallsLast24h).toBe(42);
    expect(h.rateLimits).toBe('database');
    expect(decodeURIComponent(url)).toContain('created_at=gte.2026-11-24T12:00:00.000Z');
  });
});

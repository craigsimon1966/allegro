// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handleFeedback } from '../../functions/_lib/feedback';

const req = (body: unknown) =>
  new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const env = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'pk' };

describe('POST /api/feedback', () => {
  it('stores anonymous thumbs with the public key, never a user id', async () => {
    let sent:
      { url: string; body: Record<string, unknown>; headers: Record<string, string> } | undefined;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      sent = {
        url,
        body: JSON.parse(init.body as string),
        headers: init.headers as Record<string, string>,
      };
      return new Response(null, { status: 201 });
    }) as unknown as typeof fetch;
    const res = await handleFeedback(
      req({ sessionId: 'abcdefgh-123', target: 'unit:lin-02-table-to-rule', thumbs: 1 }),
      env,
      fetchImpl,
    );
    expect(res.status).toBe(204);
    expect(sent?.url).toBe('https://x.supabase.co/rest/v1/feedback');
    expect(sent?.headers.apikey).toBe('pk');
    expect(Object.keys(sent!.body)).not.toContain('user_id');
    expect(sent?.body.target).toBe('unit:lin-02-table-to-rule');
  });
  it('rejects bad targets, empty feedback and student names', async () => {
    const f = (async () => new Response(null, { status: 201 })) as unknown as typeof fetch;
    expect(
      (await handleFeedback(req({ sessionId: 'abcdefgh', target: 'admin', thumbs: 1 }), env, f))
        .status,
    ).toBe(400);
    expect(
      (await handleFeedback(req({ sessionId: 'abcdefgh', target: 'help' }), env, f)).status,
    ).toBe(400);
    expect(
      (
        await handleFeedback(
          req({
            sessionId: 'abcdefgh',
            target: 'help',
            comment: 'My student Jayden Smith liked it',
          }),
          env,
          f,
        )
      ).status,
    ).toBe(400);
  });
  it('accepts survey scores', async () => {
    const f = (async () => new Response(null, { status: 201 })) as unknown as typeof fetch;
    const res = await handleFeedback(
      req({ sessionId: 'abcdefgh', target: 'survey', scores: { q1: 4, q5: 5 } }),
      env,
      f,
    );
    expect(res.status).toBe(204);
  });
  it('accepts an error report (comment only) and rejects one with thumbs', async () => {
    let body: Record<string, unknown> | undefined;
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      body = JSON.parse(init.body as string);
      return new Response(null, { status: 201 });
    }) as unknown as typeof fetch;
    const ok = await handleFeedback(
      req({ sessionId: 'abcdefgh-123', target: 'error', comment: 'TypeError: x\nPage: /plan' }),
      env,
      fetchImpl,
    );
    expect(ok.status).toBe(204);
    expect(body?.target).toBe('error');
    const bad = await handleFeedback(
      req({ sessionId: 'abcdefgh-123', target: 'error', comment: 'x', thumbs: 1 }),
      env,
      fetchImpl,
    );
    expect(bad.status).toBe(400);
  });
});

// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  extractJsonObject,
  generateJson,
  anthropicCompleter,
  thinkingFor,
  AiUnavailableError,
  type Completer,
} from '../../functions/_lib/anthropic';
import { handleDiagnose } from '../../functions/_lib/diagnose';
import {
  ACCESS_COOKIE,
  makeAccessToken,
  verifyAccessToken,
  hasAccess,
} from '../../functions/_lib/access';
import { resetMemoryLimits } from '../../functions/_lib/ratelimit';
import { renderPromptsModule } from '../../scripts/build-prompts';
import { DiagnosisSchema, type Diagnosis } from '../../shared/schemas';
import { personaById } from '../../shared/personas';

const SESSION = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
const tammy = personaById('tammy')!.cachedDiagnosis;

const req = (body: unknown, headers: Record<string, string> = { 'x-demo-session': SESSION }) =>
  new Request('http://localhost/api/diagnose', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const replying = (...texts: string[]): Completer => {
  let i = 0;
  return async () => ({
    text: texts[Math.min(i++, texts.length - 1)] ?? '',
    inputTokens: 10,
    outputTokens: 20,
  });
};

beforeEach(() => resetMemoryLimits());

describe('extractJsonObject', () => {
  it('finds JSON inside prose and code fences', () => {
    expect(extractJsonObject('Here you go:\n```json\n{"a": {"b": "}"}}\n```')).toEqual({
      a: { b: '}' },
    });
  });
  it('throws when there is no object', () => {
    expect(() => extractJsonObject('nothing here')).toThrow();
  });
});

describe('generateJson', () => {
  const args = {
    model: 'm',
    system: 's',
    messages: [{ role: 'user' as const, content: 'x' }],
    maxTokens: 10,
  };
  it('retries once with the validation errors, then succeeds', async () => {
    const seen: string[] = [];
    const complete: Completer = async (a) => {
      seen.push(a.messages.at(-1)!.content);
      return { text: seen.length === 1 ? '{"summary": 1}' : JSON.stringify(tammy) };
    };
    const r = await generateJson(complete, args, DiagnosisSchema);
    expect(r.ok).toBe(true);
    expect(seen).toHaveLength(2);
    expect(seen[1]).toMatch(/did not match the schema/);
  });
  it('does not ask again when the reply was cut off at the token limit', async () => {
    let calls = 0;
    const complete: Completer = async () => {
      calls++;
      return { text: '{"summary": "cut off', stopReason: 'max_tokens', outputTokens: 10 };
    };
    const r = await generateJson(complete, args, DiagnosisSchema);
    expect(r).toMatchObject({ ok: false, code: 'ai_invalid_output' });
    expect(calls).toBe(1);
  });
  it('gives up after the second bad reply', async () => {
    const r = await generateJson(replying('nope', 'still nope'), args, DiagnosisSchema);
    expect(r).toMatchObject({ ok: false, code: 'ai_invalid_output' });
  });
  it('reports unavailable when the model call fails', async () => {
    const r = await generateJson(
      async () => {
        throw new AiUnavailableError('down');
      },
      args,
      DiagnosisSchema,
    );
    expect(r).toMatchObject({ ok: false, code: 'ai_unavailable' });
  });
});

describe('POST /api/diagnose', () => {
  it('needs a demo session or sign-in', async () => {
    const res = await handleDiagnose(
      req({ situationText: 'hi' }, {}),
      {},
      { complete: replying(JSON.stringify(tammy)) },
    );
    expect(res.status).toBe(401);
  });

  it('rejects student names on the server too', async () => {
    const res = await handleDiagnose(
      req({ situationText: 'One student, Jack Smith, is struggling with fractions.' }),
      {},
      { complete: replying(JSON.stringify(tammy)) },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: { code: 'invalid_input', reason: 'student_pii' },
    });
  });

  it('drops invented tags and keeps at most 3 "now" needs', async () => {
    const bad: Diagnosis = {
      ...tammy,
      needs: Array.from({ length: 5 }, (_, i) => ({
        id: `n${i}`,
        domain: 'CK' as const,
        topic: `Topic ${i}`,
        catalogue_tags: ['algebra.linear', 'made.up.tag'],
        evidence: 'x',
        priority: 'now' as const,
      })),
    };
    const res = await handleDiagnose(
      req({ situationText: 'Year 8 maths' }),
      {},
      { complete: replying(JSON.stringify(bad)) },
    );
    expect(res.status).toBe(200);
    const d = (await res.json()) as Diagnosis;
    expect(d.needs.every((n) => n.catalogue_tags.join() === 'algebra.linear')).toBe(true);
    expect(d.needs.filter((n) => n.priority === 'now')).toHaveLength(3);
  });

  it('says the AI is unavailable when there is no key', async () => {
    const res = await handleDiagnose(req({ situationText: 'Year 8 maths' }), {});
    expect(res.status).toBe(503);
  });

  it('rate limits demo sessions after 15 calls an hour', async () => {
    const env = { RATE_LIMIT_DEMO_PER_HOUR: '2' };
    const complete = replying(JSON.stringify(tammy));
    expect((await handleDiagnose(req({ situationText: 'a' }), env, { complete })).status).toBe(200);
    expect((await handleDiagnose(req({ situationText: 'b' }), env, { complete })).status).toBe(200);
    const third = await handleDiagnose(req({ situationText: 'c' }), env, { complete });
    expect(third.status).toBe(429);
  });

  it('enforces the access code on the API when the gate is on', async () => {
    const env = { DEMO_ACCESS_CODE: 'secret', ACCESS_COOKIE_SECRET: 'k' };
    const complete = replying(JSON.stringify(tammy));
    expect((await handleDiagnose(req({ situationText: 'a' }), env, { complete })).status).toBe(401);
    const token = await makeAccessToken('k');
    const ok = await handleDiagnose(
      req(
        { situationText: 'a' },
        { 'x-demo-session': SESSION, cookie: `${ACCESS_COOKIE}=${token}` },
      ),
      env,
      { complete },
    );
    expect(ok.status).toBe(200);
  });
});

describe('access tokens', () => {
  it('verifies its own tokens and rejects tampered or expired ones', async () => {
    const t = await makeAccessToken('k', 1000);
    expect(await verifyAccessToken('k', t, 2000)).toBe(true);
    expect(await verifyAccessToken('other', t, 2000)).toBe(false);
    expect(
      await verifyAccessToken(
        'k',
        t.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a')),
        2000,
      ),
    ).toBe(false);
    expect(await verifyAccessToken('k', t, 1000 + 31 * 24 * 3600 * 1000)).toBe(false);
  });
  it('lets everyone through when no access code is set', async () => {
    expect(await hasAccess(new Request('http://x/'), {})).toBe(true);
  });
});

describe('prompts', () => {
  it('generated prompts module is in sync with prompts/*.md', () => {
    expect(readFileSync('functions/_lib/prompts.generated.ts', 'utf8')).toBe(renderPromptsModule());
  });
});

describe('anthropicCompleter', () => {
  it('turns thinking off so the reply is all answer', async () => {
    expect(thinkingFor('claude-sonnet-5-5')).toEqual({ type: 'between_tools' });
    expect(thinkingFor('claude-haiku-5-5')).toEqual({ type: 'disabled' });
    expect(thinkingFor('claude-opus-5-5')).toBeUndefined();
    let sent: Record<string, unknown> = {};
    const fakeFetch = (async (_url: unknown, init?: RequestInit) => {
      sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          id: 'msg_1',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-5-5',
          content: [{ type: 'text', text: '{"ok":true}' }],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 5, output_tokens: 3 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;
    const complete = anthropicCompleter({ ANTHROPIC_API_KEY: 'test' }, { fetch: fakeFetch });
    const r = await complete({
      model: 'claude-sonnet-5-5',
      system: 's',
      messages: [{ role: 'user', content: 'x' }],
      maxTokens: 100,
    });
    expect(sent.thinking).toEqual({ type: 'between_tools' });
    expect(sent.max_tokens).toBe(100);
    expect(r).toMatchObject({ text: '{"ok":true}', stopReason: 'end_turn', outputTokens: 3 });
  });
});

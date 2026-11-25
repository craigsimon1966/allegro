// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import type { Completer } from '../../functions/_lib/anthropic';
import { capWords, handleHelp, handleReflect } from '../../functions/_lib/help';
import { resetMemoryLimits } from '../../functions/_lib/ratelimit';

const SESSION = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-demo-session': SESSION },
    body: JSON.stringify(body),
  });
const reply =
  (o: unknown): Completer =>
  async () => ({ text: JSON.stringify(o) });

beforeEach(() => resetMemoryLimits());

describe('POST /api/help', () => {
  it('keeps the answer under 120 words and drops unknown unit ids', async () => {
    const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
    const res = await handleHelp(
      post('/api/help', { question: 'How do I explain gradient?' }),
      {},
      { complete: reply({ answer: long, tryTomorrow: 'x', detail: 'y', unitId: 'made-up' }) },
    );
    const body = (await res.json()) as { answer: string; unitId: string | null };
    expect(body.answer.split(/\s+/).length).toBeLessThanOrEqual(120);
    expect(body.unitId).toBeNull();
  });
  it('keeps a real unit id and rejects student names', async () => {
    const ok = await handleHelp(
      post('/api/help', { question: 'Pronumerals?' }),
      {},
      { complete: reply({ answer: 'Short.', unitId: 'mc-02-pronumerals' }) },
    );
    expect(((await ok.json()) as { unitId: string }).unitId).toBe('mc-02-pronumerals');
    const pii = await handleHelp(
      post('/api/help', { question: 'My student Jayden Smith says 2x is 2 + x' }),
      {},
      { complete: reply({ answer: 'x' }) },
    );
    expect(pii.status).toBe(400);
  });
});

describe('POST /api/reflect', () => {
  it('returns a short observation and a real unit', async () => {
    const res = await handleReflect(
      post('/api/reflect', {
        tried: 'Hinge question',
        happened: 'About half',
        nextTime: 'More examples',
      }),
      {},
      {
        complete: reply({
          observation: 'Testing rules surfaced the error — nice.',
          suggestedUnitId: 'mc-01-goes-up-by',
        }),
      },
    );
    const body = (await res.json()) as { observation: string; suggestedUnitId: string };
    expect(body.observation).not.toContain('—');
    expect(body.suggestedUnitId).toBe('mc-01-goes-up-by');
  });
});

describe('capWords', () => {
  it('cuts at a sentence boundary', () => {
    expect(capWords('One two three. Four five six.', 4)).toBe('One two three.');
  });
});

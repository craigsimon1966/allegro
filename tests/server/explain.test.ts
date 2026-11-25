// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import type { CompleteArgs, Completer } from '../../functions/_lib/anthropic';
import { handleExplain, unitSource } from '../../functions/_lib/explain';
import { resetMemoryLimits } from '../../functions/_lib/ratelimit';
import { UNITS, unitById } from '../../shared/catalogue';

const SESSION = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
const req = (body: unknown) =>
  new Request('http://localhost/api/explain', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-demo-session': SESSION },
    body: JSON.stringify(body),
  });

beforeEach(() => resetMemoryLimits());

describe('POST /api/explain', () => {
  it('sends only the unit text, on the fast model, and returns plain text', async () => {
    let seen: CompleteArgs | undefined;
    const complete: Completer = async (args) => {
      seen = args;
      return {
        text: 'Think of it as a recipe — start, then add.',
        inputTokens: 5,
        outputTokens: 9,
      };
    };
    const res = await handleExplain(
      req({ unitId: 'lin-02-table-to-rule', style: 'simpler' }),
      {},
      { complete },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const text = await res.text();
    expect(text).not.toContain('—');
    expect(seen?.model).toBe('claude-haiku-5-5');
    expect(seen?.maxTokens).toBe(400);
    const unit = unitById('lin-02-table-to-rule')!;
    expect(seen?.system).toContain(unitSource(unit));
    // No other unit's text leaks into the prompt.
    const other = unitById('prop-01-ratio-tables')!;
    expect(seen?.system).not.toContain(other.coreIdeaMd);
  });

  it('rejects unknown units and bad styles', async () => {
    const complete: Completer = async () => ({ text: 'x' });
    expect(
      (await handleExplain(req({ unitId: 'nope', style: 'simpler' }), {}, { complete })).status,
    ).toBe(400);
    expect(
      (
        await handleExplain(
          req({ unitId: 'lin-02-table-to-rule', style: 'louder' }),
          {},
          { complete },
        )
      ).status,
    ).toBe(400);
  });

  it('returns ai_unavailable when the model fails', async () => {
    const complete: Completer = async () => {
      throw new Error('down');
    };
    const res = await handleExplain(
      req({ unitId: 'lin-02-table-to-rule', style: 'different_context' }),
      {},
      { complete },
    );
    expect(res.status).toBe(503);
  });
});

describe('generated unit list', () => {
  it('includes every unit file', () => {
    expect(UNITS.length).toBe(
      readdirSync('content/units').filter((f) => f.endsWith('.json')).length,
    );
  });
});

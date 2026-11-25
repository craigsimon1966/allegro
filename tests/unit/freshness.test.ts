import { beforeEach, describe, expect, it } from 'vitest';
import { checkForUpdate, isStale, resetFreshness } from '@/lib/freshness';

const live = (text: string) =>
  (async () => new Response(text, { status: 200 })) as unknown as typeof fetch;

beforeEach(() => resetFreshness());

describe('freshness', () => {
  it('notices when the live build differs from the one running', async () => {
    expect(await checkForUpdate(live('0811824 main 2026-11-25T11:18:47Z\n'), 1e6, '4ff71f2')).toBe(
      true,
    );
    expect(isStale()).toBe(true);
  });
  it('stays quiet for the same build, local builds, errors and odd replies', async () => {
    expect(await checkForUpdate(live('4ff71f2 main x'), 1e6, '4ff71f2')).toBe(false);
    resetFreshness();
    expect(await checkForUpdate(live('0811824 main x'), 1e6, 'local')).toBe(false);
    resetFreshness();
    expect(await checkForUpdate(live('<!doctype html>'), 1e6, '4ff71f2')).toBe(false);
    resetFreshness();
    const down = (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await checkForUpdate(down, 1e6, '4ff71f2')).toBe(false);
  });
  it('asks at most once a minute', async () => {
    let calls = 0;
    const f = (async () => {
      calls++;
      return new Response('4ff71f2 main x');
    }) as unknown as typeof fetch;
    await checkForUpdate(f, 1_000_000, '4ff71f2');
    await checkForUpdate(f, 1_030_000, '4ff71f2');
    await checkForUpdate(f, 1_070_000, '4ff71f2');
    expect(calls).toBe(2);
  });
});

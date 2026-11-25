import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession, onAuthStateChange: vi.fn() } },
}));

const { restoreSession } = await import('@/lib/session');
const { useAppStore } = await import('@/lib/store');

describe('restoreSession', () => {
  beforeEach(() => useAppStore.getState().reset());
  it('puts a returning teacher back in signed-in mode without a new link', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    await restoreSession();
    expect(useAppStore.getState().mode).toBe('signed_in');
  });
  it('leaves demo mode alone', async () => {
    useAppStore.getState().startDemo('tammy');
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    await restoreSession();
    expect(useAppStore.getState().mode).toBe('demo');
  });
  it('drops signed-in mode when the session has gone', async () => {
    useAppStore.getState().setSignedIn();
    getSession.mockResolvedValue({ data: { session: null } });
    await restoreSession();
    expect(useAppStore.getState().mode).toBe('anonymous');
  });
});

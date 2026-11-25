import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SetupStatus } from '@/features/admin/SetupStatus';

afterEach(() => vi.unstubAllGlobals());

describe('SetupStatus on /admin/feedback', () => {
  it('shows what is set and explains what is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ok: true,
              version: 'abc1234',
              branch: 'main',
              contentVersion: '28 units, 0 reviewed, 1234abcd',
              aiCallsLast24h: null,
              setup: {
                anthropicKey: true,
                supabase: true,
                serviceRoleKey: false,
                accessCode: true,
              },
              rateLimits: 'memory',
            }),
            { status: 200 },
          ),
      ),
    );
    render(<SetupStatus />);
    expect(await screen.findByText(/Version abc1234 \(main\)/)).toBeTruthy();
    expect(screen.getByText(/AI calls in the last 24 hours: not counted/)).toBeTruthy();
    expect(screen.getByText(/Add it in Cloudflare as a secret/)).toBeTruthy();
    expect(screen.getAllByText('Set')).toHaveLength(3);
    expect(screen.getAllByText('Missing')).toHaveLength(1);
  });
});

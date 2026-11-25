import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RouteError } from '@/app/RouteError';

const reportError = vi.fn();
vi.mock('@/lib/errorReport', () => ({ reportError: (e: unknown) => reportError(e) }));

function Boom(): never {
  throw new Error('kaboom');
}

describe('RouteError', () => {
  it('shows the friendly page and reports the error, loading the reporter on demand', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const router = createMemoryRouter([
      { path: '/', element: <Boom />, errorElement: <RouteError /> },
    ]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { name: /Something went wrong/ })).toBeTruthy();
    await waitFor(() => expect(reportError).toHaveBeenCalled());
    expect((reportError.mock.calls[0]![0] as Error).message).toBe('kaboom');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

afterEach(cleanup);
import { MemoryRouter } from 'react-router-dom';

const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
const verifyOtp = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOtp,
      verifyOtp,
      signOut: vi.fn(),
    },
  },
}));
vi.mock('@/lib/api', () => ({ loadLatestFromSupabase: vi.fn().mockResolvedValue(false) }));

const { SignInForm } = await import('@/features/auth/SignInForm');
const { useAppStore } = await import('@/lib/store');

async function sendCode() {
  render(
    <MemoryRouter>
      <SignInForm />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText('Sign in with your email'), {
    target: { value: 'teacher@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Email me a sign-in code/ }));
  await screen.findByLabelText('Code from the email');
}

describe('sign in with a code', () => {
  it('signs in with the 6-digit code from the email', async () => {
    verifyOtp.mockResolvedValue({ error: null });
    await sendCode();
    expect(signInWithOtp.mock.calls[0]![0].email).toBe('teacher@example.com');
    fireEvent.change(screen.getByLabelText('Code from the email'), {
      target: { value: '123 456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in/ }));
    await waitFor(() => expect(useAppStore.getState().mode).toBe('signed_in'));
    expect(verifyOtp).toHaveBeenCalledWith({
      email: 'teacher@example.com',
      token: '123456',
      type: 'email',
    });
  });
  it('says plainly when the code is wrong', async () => {
    useAppStore.getState().reset();
    verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } });
    await sendCode();
    fireEvent.change(screen.getByLabelText('Code from the email'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign in/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/expired/);
    expect(useAppStore.getState().mode).toBe('anonymous');
  });
});

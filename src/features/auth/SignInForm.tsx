import { useEffect, useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Label } from '@/components/Label';
import { MarginNote } from '@/components/MarginNote';
import { supabase } from '@/lib/supabase';
import { loadLatestFromSupabase } from '@/lib/api';
import { useAppStore } from '@/lib/store';

/**
 * Email sign-in (TECH_SPEC 6.1). The email has a 6-digit code and a link; either works.
 * The code avoids the link opening in a mail app's own browser. Teachers never set a password.
 */
export function SignInForm() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error' | 'unavailable'>('idle');
  const [message, setMessage] = useState('');
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const codeId = useId();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState('');
  const navigate = useNavigate();
  const setSignedIn = useAppStore((s) => s.setSignedIn);
  const reset = useAppStore((s) => s.reset);

  // Already signed in (for example after the magic link): offer to carry on, not a new link.
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth
      .getSession()
      .then(({ data }) => setSignedInAs(data.session?.user.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedInAs(session?.user.email ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const carryOn = async () => {
    setSignedIn();
    const returning = await loadLatestFromSupabase().catch(() => false);
    navigate(returning ? '/needs' : '/start');
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    reset();
    setSignedInAs(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setState('unavailable');
      return;
    }
    setState('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setState('error');
      setMessage(
        error.status === 403 || /not on the allegro pilot list/i.test(error.message)
          ? "This email isn't on the pilot list yet. Please contact the Allegro team."
          : error.status === 429 && /seconds/i.test(error.message)
            ? 'We sent an email a moment ago. Please check your email, or wait a minute and try again.'
            : error.status === 429
              ? "We've sent a lot of sign-in emails in the last hour. Please try again a little later, or use the email already in your inbox."
              : "We couldn't send the email. Please check the address and try again.",
      );
    } else {
      setState('sent');
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setChecking(true);
    setCodeError('');
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.replace(/\D/g, ''),
      type: 'email',
    });
    setChecking(false);
    if (error) {
      setCodeError(
        /expired/i.test(error.message)
          ? 'That code has expired. Go back and send a new one.'
          : "That code didn't work. Check the numbers and try again.",
      );
      return;
    }
    await carryOn();
  };

  if (signedInAs) {
    return (
      <div role="status" className="flex flex-col gap-2.5">
        <p className="font-bold">You&apos;re signed in as {signedInAs}.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void carryOn()}>
            Carry on <span aria-hidden="true">→</span>
          </Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'sent') {
    return (
      <form onSubmit={verify} className="flex flex-col gap-2.5">
        <p className="font-bold" role="status">
          Check your email.
        </p>
        <p>
          We&apos;ve sent a sign-in email to {email}. Type the code from it here, or tap the link in
          the email. Both work once and expire in 1 hour.
        </p>
        <Label as="label" htmlFor={codeId}>
          Code from the email
        </Label>
        <input
          id={codeId}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,12}"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-12 w-48 rounded border-2 border-ink bg-field px-3 text-[20px] tracking-[0.2em] text-ink"
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={checking}>
            {checking ? 'Checking…' : 'Sign in'} <span aria-hidden="true">→</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setState('idle');
              setCode('');
              setCodeError('');
            }}
          >
            Use a different email
          </Button>
        </div>
        {codeError && (
          <p role="alert" className="font-bold text-error">
            {codeError}
          </p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <Label as="label" htmlFor={id}>
        Sign in with your email
      </Label>
      <input
        id={id}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-12 rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
      />
      <Button type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Email me a sign-in code'}{' '}
        <span aria-hidden="true">→</span>
      </Button>
      <MarginNote size={21}>No password. The code works once.</MarginNote>
      {state === 'error' && (
        <p role="alert" className="font-bold text-error">
          {message}
        </p>
      )}
      {state === 'unavailable' && (
        <p role="alert" className="text-ink">
          Sign-in isn&apos;t switched on in this preview yet. You can try Allegro as one of the demo
          teachers below.
        </p>
      )}
    </form>
  );
}

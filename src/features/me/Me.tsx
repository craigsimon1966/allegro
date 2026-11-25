import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { personaById } from '@shared/personas';

// The "Me" tab: who you are in Allegro, how to sign out or leave the demo, and where your
// settings and privacy information live. Not defined in the specs (see docs/decisions.md).

const LINKS = [
  {
    to: '/needs',
    label: 'Your needs',
    note: 'Change the order, rate your confidence, add or remove',
  },
  { to: '/start', label: 'Describe your situation again', note: 'Allegro will suggest new needs' },
  { to: '/survey', label: 'Tell us about the pilot', note: 'About a minute' },
  {
    to: '/about-demo',
    label: 'About this demo, privacy and your data',
    note: 'Including how to delete your account',
  },
];

export default function Me() {
  const mode = useAppStore((s) => s.mode);
  const personaId = useAppStore((s) => s.personaId);
  const reset = useAppStore((s) => s.reset);
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'signed_in' || !supabase) return;
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [mode]);

  if (mode === 'anonymous') return <Navigate to="/demo" replace />;

  const persona = personaId ? personaById(personaId) : undefined;
  const leave = async () => {
    if (mode === 'signed_in') await supabase?.auth.signOut().catch(() => null);
    reset();
    navigate('/');
  };

  return (
    <AppShell>
      <MarginLayout>
        <Label>Me</Label>
        <h1 className="mt-1 text-[30px] leading-tight">
          {mode === 'signed_in' ? 'Your account' : 'Your demo'}
        </h1>
        <div className="mt-3 max-w-prose">
          {mode === 'signed_in' ? (
            <p>
              You&apos;re signed in{email ? ` as ${email}` : ''}. Your pathway, lessons and
              reflections are saved securely in Australia.
            </p>
          ) : (
            <p>
              You&apos;re trying Allegro{' '}
              {persona ? `as ${persona.name}` : 'with your own situation'}. Everything stays in this
              browser.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {mode === 'demo' && (
              <Button
                variant="secondary"
                onClick={() => {
                  reset();
                  navigate('/demo');
                }}
              >
                Try a different teacher
              </Button>
            )}
            <Button variant="secondary" onClick={() => void leave()}>
              {mode === 'signed_in' ? 'Sign out' : 'Leave the demo'}
            </Button>
          </div>
          {mode === 'demo' && (
            <p className="mt-2 text-[15px] text-muted">
              Leaving clears this demo from the browser.
            </p>
          )}
        </div>

        <div className="mt-8 max-w-prose">
          <SectionRule>Settings and information</SectionRule>
          <ul>
            {LINKS.map((l) => ({
              ...l,
              note:
                l.to === '/about-demo' && mode === 'demo'
                  ? 'Including what is kept in this browser'
                  : l.note,
            })).map((l) => (
              <li key={l.to} className="border-b border-rule">
                <Link
                  to={l.to}
                  className="flex min-h-tap flex-col justify-center py-2 no-underline"
                >
                  <span className="font-bold text-green-700 underline">{l.label}</span>
                  <span className="text-[13px] text-muted">{l.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </MarginLayout>
    </AppShell>
  );
}

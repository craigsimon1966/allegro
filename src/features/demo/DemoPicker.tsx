import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AllegroMark } from '@/components/AllegroMark';
import { Button } from '@/components/Button';
import { Label } from '@/components/Label';
import { PERSONAS } from '@shared/personas';
import { useAppStore } from '@/lib/store';
import { ApiError, hasAccessCookie, submitAccessCode } from '@/lib/api';
import { SignInForm } from '@/features/auth/SignInForm';

const GATE_ON = import.meta.env.VITE_REQUIRE_ACCESS_CODE === 'true';

function AccessGate({ onOpen }: { onOpen: () => void }) {
  const id = useId();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await submitAccessCode(code);
      onOpen();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That code didn't work.");
    }
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <Label as="label" htmlFor={id}>
        Demo access code
      </Label>
      <input
        id={id}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
        className="h-12 rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
      />
      <Button type="submit">Continue</Button>
      {error && (
        <p role="alert" className="font-bold text-error">
          {error}
        </p>
      )}
    </form>
  );
}

/** Persona picker and sign-in (SPEC 7.2). */
export default function DemoPicker() {
  const navigate = useNavigate();
  const startDemo = useAppStore((s) => s.startDemo);
  const setIntake = useAppStore((s) => s.setIntake);
  const setDiagnosis = useAppStore((s) => s.setDiagnosis);
  const [open, setOpen] = useState(!GATE_ON);

  useEffect(() => {
    if (GATE_ON) void hasAccessCookie().then(setOpen);
  }, []);

  const choose = (personaId: string) => {
    const p = PERSONAS.find((x) => x.id === personaId);
    if (!p) return;
    startDemo(p.id);
    setIntake({ situationText: p.situationText, guided: p.guided });
    // Cached diagnosis: no AI call, so the demo works even if the API is down (SPEC 7.2).
    setDiagnosis(p.cachedDiagnosis);
    navigate('/needs');
  };

  const startOwn = () => {
    startDemo(null);
    navigate('/start');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative flex flex-col gap-3 bg-sage-500 pb-6 pl-content pr-6 pt-9 text-ink">
        <AllegroMark
          product="equip"
          tone="ink"
          size={30}
          className="absolute left-3.5 top-[38px]"
        />
        <div className="text-[13px] font-bold uppercase tracking-[0.14em]">Allegro Learning</div>
        <h1 className="max-w-[22ch] text-[32px] leading-[1.15]">
          Learn it in five minutes. Teach it with confidence.
        </h1>
        <p className="max-w-prose text-base">
          Professional learning built around your class, your topic and your week.
        </p>
      </header>
      <main id="main" className="relative flex flex-1 flex-col">
        <div aria-hidden="true" className="margin-line" />
        <div className="relative mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-3 pb-6 pl-content pr-5 pt-6">
          {!open ? (
            <AccessGate onOpen={() => setOpen(true)} />
          ) : (
            <>
              <SignInForm />
              <Label as="h2" className="mt-4">
                Or try it as a demo teacher
              </Label>
              <ul className="-ml-content -mr-5 border-t-2 border-rule-strong">
                {PERSONAS.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => choose(p.id)}
                      className="flex min-h-[62px] w-full items-center border-b border-rule text-left text-ink hover:bg-sage-100"
                    >
                      <span
                        aria-hidden="true"
                        className="w-margin shrink-0 text-center font-heading text-[22px] font-semibold text-plum-500"
                      >
                        {p.initial}
                      </span>
                      <span className="flex flex-1 flex-col pl-4">
                        <span className="text-[17px] font-bold">{p.name}</span>
                        <span className="text-sm text-muted">{p.situation}</span>
                      </span>
                      <span aria-hidden="true" className="pr-5 text-xl text-green-700">
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={startOwn}
                className="mt-2 min-h-tap self-start text-left font-bold text-green-700 underline"
              >
                Try it with your own situation, without signing in
              </button>
              <p className="text-sm text-muted">
                Demo teachers and anything you try without signing in stay in this browser. If you
                sign in, your pathway, lessons and reflections are saved securely in Australia.
              </p>
            </>
          )}
          <Link to="/about-demo" className="mt-auto pb-2 pt-3.5 text-sm font-bold text-green-700">
            How Allegro uses AI and your data
          </Link>
        </div>
      </main>
    </div>
  );
}

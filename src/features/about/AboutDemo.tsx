import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MarginLayout } from '@/components/MarginLayout';
import { SectionRule, Label } from '@/components/Label';
import { Button } from '@/components/Button';
import { useAppStore, useMode } from '@/lib/store';
import { ApiError, deleteAccount } from '@/lib/api';

// SPEC 7.12: what Allegro is, what the demo does and does not do, how AI is used, what data
// is stored and where, how to delete it, who to contact. Deletion follows TECH_SPEC 5.3.
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What Allegro is',
    body: [
      'Allegro Learning is professional learning for Australian teachers, starting with teachers who are new to teaching maths in Years 7 to 9.',
    ],
  },
  {
    title: 'What this demo does, and does not do',
    body: [
      'It shows one loop: tell us your situation, see what you need, learn in 5 minutes, plan a lesson and reflect afterwards.',
      "It is a pilot, not a finished product. Learning units marked Draft have not yet been checked by a maths educator. Curriculum codes are still being looked up. The leader view uses made-up data for a fictional school. It doesn't connect to your school's systems, and it doesn't assess or rank you.",
    ],
  },
  {
    title: 'How AI is used',
    body: [
      'AI helps understand your situation, choose and order learning that fits, and draft lesson ideas, explanations and quick answers. The learning in Allegro has been shaped by experienced maths educators, and the common misconceptions and curriculum details in a lesson always come from that learning content, not from the AI.',
      "Anything drafted by AI is labelled and can be edited. Please check it before using it with a class. Please don't include student names or personal details. If something looks like a student's name, Allegro will ask you to remove it.",
    ],
  },
  {
    title: 'Your data',
    body: [
      'If you try the demo as one of our example teachers, nothing leaves your browser except the questions you ask the AI.',
      'If you describe your own situation without signing in, the text is sent to our AI to work out your needs and is not stored.',
      "If you sign in, your situation, pathway, lessons, reflections and confidence ratings are saved in Australia (Sydney) and only you can see them. We keep a count of AI requests (no text) to manage costs. Feedback and survey answers are anonymous and aren't linked to your account.",
    ],
  },
  {
    title: 'Voice input',
    body: [
      "The microphone button uses your browser's own speech recognition. In Chrome and Edge this sends your audio to Google or Microsoft to turn it into text. Allegro never receives the audio, only the words that appear in the box. If you'd rather not, just type.",
    ],
  },
  {
    title: 'Using Allegro on a phone or iPad',
    body: [
      "Add Allegro to your Home Screen and it opens like an app. On an iPhone or iPad, open Allegro in Safari, tap Share, then Add to Home Screen. On Android, open the Chrome menu and tap Add to Home screen. On an iPhone or iPad this also keeps you signed in: Safari forgets a website you haven't visited for 7 days, but not one on your Home Screen.",
    ],
  },
  {
    title: 'Who to contact',
    body: [
      'Allegro Learning is being built by RockMouse. If you have a question, a privacy request or something looks wrong, contact the person who invited you to the pilot.',
    ],
  },
];

function DeleteAccount() {
  const mode = useMode();
  const reset = useAppStore((st) => st.reset);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (mode !== 'signed_in')
    return (
      <div className="mt-2 max-w-prose">
        <p>
          You're not signed in, so there's no account to delete. Demo data lives only in this
          browser.
        </p>
        {mode === 'demo' && (
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              reset();
              navigate('/', { replace: true });
            }}
          >
            Clear demo data from this browser
          </Button>
        )}
      </div>
    );

  async function run() {
    setBusy(true);
    setMessage(null);
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "We couldn't delete your account just now.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 max-w-prose">
      <p>
        This removes your account and everything saved with it: your situation, pathway, lessons,
        reflections and confidence ratings. It can't be undone.
      </p>
      {!confirming ? (
        <Button variant="secondary" className="mt-3" onClick={() => setConfirming(true)}>
          Delete my account and data
        </Button>
      ) : (
        <div className="mt-3 border-l-2 border-error pl-3">
          <p className="font-bold">Are you sure? This deletes everything straight away.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button onClick={() => void run()} disabled={busy}>
              {busy ? 'Deleting…' : 'Yes, delete everything'}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
              Keep my account
            </Button>
          </div>
        </div>
      )}
      {message && (
        <p role="alert" className="mt-3 font-bold text-error">
          {message}
        </p>
      )}
    </div>
  );
}

export default function AboutDemo() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <MarginLayout className="lg:mx-auto lg:max-w-[760px]">
          <Label>About this demo</Label>
          <h1 className="mt-1 text-[30px] leading-tight">
            What this demo is, and how it treats you
          </h1>
          <div className="mt-6 flex flex-col gap-6">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <SectionRule>{s.title}</SectionRule>
                {s.body.map((p) => (
                  <p key={p.slice(0, 24)} className="mt-2 max-w-prose">
                    {p}
                  </p>
                ))}
              </section>
            ))}
            <section>
              <SectionRule>Delete your account and data</SectionRule>
              <DeleteAccount />
            </section>
          </div>
        </MarginLayout>
      </main>
      <SiteFooter />
    </>
  );
}

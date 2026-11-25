import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MarginLayout } from '@/components/MarginLayout';
import { SectionRule, Label } from '@/components/Label';

// Placeholder for SPEC 7.12. The full page, including account deletion, is written in M5.
const SECTIONS = [
  {
    title: 'What Allegro is',
    body: 'Allegro Learning is professional learning for Australian teachers, starting with teachers who are new to teaching maths in Years 7 to 9.',
  },
  {
    title: 'What this demo does',
    body: 'It shows one loop: tell us your situation, see what you need, learn in 5 minutes, plan a lesson and reflect afterwards. The leader view uses made-up data.',
  },
  {
    title: 'How AI is used',
    body: "AI helps understand your situation, choose and order learning that fits, and draft lesson ideas. People write and check the learning content. Anything drafted by AI is labelled and can be edited. Please don't include student names or personal details.",
  },
  {
    title: 'Your data',
    body: "If you try the demo as one of our example teachers, nothing leaves your browser. If you describe your own situation without signing in, the text is sent to our AI to work out your needs and is not stored. If you sign in, your pathway, lessons and reflections are saved in Australia and only you can see them. You'll be able to delete your account and data from this page.",
  },
  {
    title: 'Voice input',
    body: "The microphone button uses your browser's own speech recognition. In Chrome and Edge this sends your audio to Google or Microsoft to turn it into text. Allegro never receives the audio, only the words that appear in the box. If you'd rather not, just type.",
  },
];

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
                <p className="mt-2 max-w-prose">{s.body}</p>
              </section>
            ))}
          </div>
          <p className="mt-8 max-w-prose text-muted">
            This page is a first version. The full privacy statement, account deletion and contact
            details come before the pilot.
          </p>
        </MarginLayout>
      </main>
      <SiteFooter />
    </>
  );
}

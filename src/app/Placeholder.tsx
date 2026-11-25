import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { Label } from '@/components/Label';

interface Props {
  title: string;
  milestone?: string;
  /** Teacher screens use the app frame (tabs and sidebar); public ones don't. */
  shell?: boolean;
  step?: number;
  /** One line on what the screen will do, shown to teachers. */
  blurb?: string;
}

// Screens not built yet. Teacher screens say what's coming and point back to the week,
// so a demo never hits a dead end.
export function Placeholder({ title, milestone, shell = false, step, blurb }: Props) {
  const body = (
    <MarginLayout>
      {milestone && <Label>Coming soon</Label>}
      <h1 className="mt-1 text-[30px] leading-tight">{title}</h1>
      <p className="mt-4 max-w-prose text-muted">
        {blurb ??
          (milestone
            ? 'This part of Allegro is still being built.'
            : "We couldn't find that page.")}
      </p>
      <p className="mt-6">
        <Link to={shell ? '/pathway' : '/'} className="font-bold text-green-700 underline">
          {shell ? 'Back to this week' : 'Back to home'}
        </Link>
      </p>
    </MarginLayout>
  );
  return shell ? <AppShell step={step}>{body}</AppShell> : <main id="main">{body}</main>;
}

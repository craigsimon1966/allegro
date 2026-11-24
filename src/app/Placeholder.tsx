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
}

export function Placeholder({ title, milestone, shell = false, step }: Props) {
  const body = (
    <MarginLayout>
      {milestone && <Label>Coming in {milestone}</Label>}
      <h1 className="mt-1 text-[30px] leading-tight">{title}</h1>
      <p className="mt-4 max-w-prose text-muted">This screen isn&apos;t built yet.</p>
      <p className="mt-6">
        <Link to="/" className="text-green-700 underline">
          Back to home
        </Link>
      </p>
    </MarginLayout>
  );
  return shell ? <AppShell step={step}>{body}</AppShell> : <main id="main">{body}</main>;
}

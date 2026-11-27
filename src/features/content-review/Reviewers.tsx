import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { Button } from '@/components/Button';
import { grantReviewer, loadReviewers, revokeReviewer, type Reviewer } from '@/lib/contentReview';
import { formatWhen, ReviewGate, useReviewAccess } from './reviewCommon';

// /review/reviewers (admin only): give the reviewer role by email. Adding someone also puts
// them on the pilot list, so they can sign in with the usual emailed code.

export default function Reviewers() {
  const access = useReviewAccess();
  return (
    <ReviewGate access={access} path="/review/reviewers">
      {(role) =>
        role.isAdmin ? (
          <Manage />
        ) : (
          <>
            <SiteHeader />
            <main id="main">
              <MarginLayout>
                <p>
                  Only the admin can manage reviewers.{' '}
                  <Link className="font-bold text-green-700 underline" to="/review">
                    Back to the queue
                  </Link>
                </p>
              </MarginLayout>
            </main>
          </>
        )
      }
    </ReviewGate>
  );
}

function Manage() {
  const [list, setList] = useState<Reviewer[] | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = () => void loadReviewers().then(setList);
  useEffect(reload, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setProblem('');
    setDone('');
    try {
      await grantReviewer(email, name);
      setDone(
        `${name.trim()} can now review. Ask them to sign in at this site with ${email.trim().toLowerCase()}, then open /review.`,
      );
      setEmail('');
      setName('');
      reload();
    } catch (err) {
      setProblem((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Reviewer) => {
    setProblem('');
    setDone('');
    try {
      await revokeReviewer(r.email);
      setDone(`${r.display_name} is no longer a reviewer. Their past reviews stay in the history.`);
      reload();
    } catch (err) {
      setProblem((err as Error).message);
    }
  };

  return (
    <>
      <SiteHeader />
      <main id="main">
        <MarginLayout className="lg:mx-auto lg:max-w-[900px]">
          <p>
            <Link className="font-bold text-green-700 underline" to="/review">
              Back to the review queue
            </Link>
          </p>
          <Label className="mt-4">Admin</Label>
          <h1 className="mt-1 text-[30px] leading-tight">Reviewers</h1>
          <p className="mt-2 max-w-prose">
            Reviewers can approve, edit and flag content. Adding someone also adds their email to
            the pilot list so they can sign in.
          </p>

          <form onSubmit={(e) => void add(e)} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rev-name" className="mb-1.5 block font-bold">
                Name (shown against their reviews)
              </label>
              <input
                id="rev-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
              />
            </div>
            <div>
              <label htmlFor="rev-email" className="mb-1.5 block font-bold">
                Email
              </label>
              <input
                id="rev-email"
                type="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded border-2 border-ink bg-field px-3 text-[17px] text-ink"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>
                Add reviewer
              </Button>
            </div>
          </form>
          {problem && (
            <p role="alert" className="mt-3 font-bold text-error">
              {problem}
            </p>
          )}
          {done && (
            <p role="status" className="mt-3 font-bold text-success">
              {done}
            </p>
          )}

          <section className="mt-8">
            <SectionRule>Current reviewers</SectionRule>
            <ul className="mt-1">
              {(list ?? []).map((r) => (
                <li
                  key={r.email}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-3"
                >
                  <span>
                    <strong>{r.display_name}</strong> <span className="text-muted">{r.email}</span>
                    <span className="block text-[14px] text-muted">
                      Added {formatWhen(r.granted_at)}
                    </span>
                  </span>
                  <Button variant="secondary" onClick={() => void remove(r)}>
                    Remove
                  </Button>
                </li>
              ))}
              {list && !list.length && <li className="py-3 text-muted">No reviewers yet.</li>}
            </ul>
            <p className="mt-3 text-[15px] text-muted">As the admin you can always review too.</p>
          </section>
        </MarginLayout>
      </main>
    </>
  );
}

/* eslint-disable react-refresh/only-export-components -- small helpers shared by the review screens */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { MarginLayout } from '@/components/MarginLayout';
import { AllegroMark } from '@/components/AllegroMark';
import { ButtonLink } from '@/components/Button';
import { useMode } from '@/lib/store';
import { rememberNext } from '@/lib/nextPath';
import { loadReviewRole, useReviewStore, type ReviewRole } from '@/lib/contentReview';
import {
  effectiveStatus,
  reviewItems,
  STATUS_LABELS,
  type EffectiveStatus,
  type ReviewFilter,
  type ReviewItem,
  type ReviewRow,
} from '@shared/review';

type Access = 'loading' | 'signed_out' | 'denied' | ReviewRole;

export function useReviewAccess(): Access {
  const mode = useMode();
  const [access, setAccess] = useState<Access>('loading');
  useEffect(() => {
    if (mode !== 'signed_in') {
      setAccess('signed_out');
      return;
    }
    let live = true;
    loadReviewRole()
      .then((r) => live && setAccess(r ? (r.isReviewer ? r : 'denied') : 'signed_out'))
      .catch(() => live && setAccess('denied'));
    return () => {
      live = false;
    };
  }, [mode]);
  return access;
}

/** Shows loading, sign-in or "not a reviewer" screens, or the page itself. */
export function ReviewGate({
  access,
  path,
  children,
}: {
  access: Access;
  path: string;
  children: (role: ReviewRole) => React.ReactNode;
}) {
  if (access === 'loading')
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <AllegroMark size={48} loading label="Loading" />
      </div>
    );
  if (access === 'signed_out' || access === 'denied')
    return (
      <>
        <SiteHeader />
        <main id="main">
          <MarginLayout>
            <h1 className="text-[30px] leading-tight">Content review</h1>
            {access === 'signed_out' ? (
              <>
                <p className="mt-3 max-w-prose">
                  Sign in with the email address your reviewer invitation was sent to.
                </p>
                <ButtonLink to="/signin" className="mt-4" onClick={() => rememberNext(path)}>
                  Sign in to review
                </ButtonLink>
              </>
            ) : (
              <p className="mt-3 max-w-prose">
                Your account is not set up as a reviewer yet. Ask Craig to add you, then sign in
                again.{' '}
                <Link className="font-bold text-green-700 underline" to="/">
                  Back to the home page
                </Link>
              </p>
            )}
          </MarginLayout>
        </main>
      </>
    );
  return <>{children(access)}</>;
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Sydney',
  });
}

const STATUS_STYLE: Record<EffectiveStatus, string> = {
  draft: 'border-warning text-ink',
  changed: 'border-warning text-ink',
  flagged: 'border-error text-error',
  approved: 'border-success text-success',
};

export function StatusMark({ status }: { status: EffectiveStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border-2 px-2 py-0.5 text-[13px] font-bold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const FILTER_KEY = 'allegro-review-filter';
export const DEFAULT_FILTER: ReviewFilter = { kinds: [], years: [], state: null, status: 'todo' };

export function loadFilter(): ReviewFilter | null {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    return raw ? { ...DEFAULT_FILTER, ...(JSON.parse(raw) as Partial<ReviewFilter>) } : null;
  } catch {
    return null;
  }
}

export function saveFilter(f: ReviewFilter) {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(f));
  } catch {
    // Not saved between visits: fine.
  }
}

export interface ItemWithStatus {
  item: ReviewItem;
  row: ReviewRow | undefined;
  status: EffectiveStatus;
}

/** Every item with its review row and status, recomputed when reviews change. */
export function useItemsWithStatus(): ItemWithStatus[] {
  const rows = useReviewStore((s) => s.rows);
  return useMemo(() => {
    const byKey = new Map(rows.map((r) => [`${r.item_kind}:${r.item_id}`, r]));
    return reviewItems().map((item) => {
      const row = byKey.get(`${item.kind}:${item.id}`);
      return { item, row, status: effectiveStatus(item, row) };
    });
  }, [rows]);
}

export function Toggle({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-tap min-w-tap rounded border-2 px-3 text-[15px] font-bold ${
        pressed ? 'border-green-700 bg-green-700 text-white' : 'border-ink bg-surface text-ink'
      }`}
    >
      {children}
    </button>
  );
}

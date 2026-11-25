import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { MarginLayout } from '@/components/MarginLayout';

/** Shown instead of a blank screen when a page crashes. The error is reported for the pilot. */
export function RouteError() {
  const error = useRouteError();
  // Loaded on demand: errorReport pulls in the data layer, which would bloat the first download.
  useEffect(() => {
    void import('@/lib/errorReport').then((m) => m.reportError(error));
  }, [error]);
  return (
    <main id="main">
      <MarginLayout>
        <h1 className="mt-1 text-[30px] leading-tight">Something went wrong on this page</h1>
        <p className="mt-4 max-w-prose">
          Sorry about that. We&apos;ve been told about it. Your work is saved, so you can go back
          and carry on.
        </p>
        <p className="mt-6 flex flex-wrap gap-x-5">
          <Link to="/pathway" className="font-bold text-green-700 underline">
            Back to this week
          </Link>
          <button
            type="button"
            className="min-h-tap font-bold text-green-700 underline"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
        </p>
      </MarginLayout>
    </main>
  );
}

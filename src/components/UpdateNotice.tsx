import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { checkForUpdate, isStale } from '@/lib/freshness';

/**
 * When a newer build is live: the next change of screen loads it (nothing is lost, the old
 * screen is already gone), and a line at the top offers to reload now.
 */
export function UpdateNotice() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const last = useRef(pathname);

  useEffect(() => {
    if (pathname !== last.current && isStale()) {
      window.location.reload();
      return;
    }
    last.current = pathname;
    void checkForUpdate().then(setShow);
  }, [pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkForUpdate().then(setShow);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  if (!show) return null;
  return (
    <div role="status" className="no-print border-b-2 border-ink bg-surface px-4 py-2 text-[15px]">
      A newer version of Allegro is ready.{' '}
      <button
        type="button"
        className="min-h-tap font-bold text-green-700 underline"
        onClick={() => window.location.reload()}
      >
        Reload now
      </button>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'Allegro Learning';
/** Screens whose heading is a marketing line rather than a page name. */
const TITLES: Record<string, string> = { '/': SITE, '/demo': `Try the demo · ${SITE}` };

/**
 * After each change of screen: names the browser tab after the page's heading (WCAG 2.4.2) and
 * moves focus to that heading, so screen readers announce the new page (WCAG 2.4.3).
 * The first load is left alone. Screens load lazily, so it waits for the heading to appear.
 */
export function RouteFocus() {
  const { pathname } = useLocation();
  // The last screen we handled. Not a "first run" flag, which React's dev double run would trip.
  const last = useRef<string | null>(null);
  // The previous screen's heading. A lazy screen keeps the old one on show while it loads.
  const lastH1 = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const moveFocus = last.current !== null && last.current !== pathname;
    last.current = pathname;
    let frame = 0;
    let tries = 0;
    const look = () => {
      const h1 =
        document.querySelector<HTMLElement>('main h1') ?? document.querySelector<HTMLElement>('h1');
      const stale = moveFocus && h1 === lastH1.current && h1?.isConnected;
      if (!h1 || stale) {
        // About 3 seconds at 60 frames a second, enough for a lazy screen or a short load.
        if (tries++ < 180) frame = requestAnimationFrame(look);
        return;
      }
      lastH1.current = h1;
      const name = h1.textContent?.trim();
      document.title = TITLES[pathname] ?? (name && name !== SITE ? `${name} · ${SITE}` : SITE);
      if (moveFocus && !h1.contains(document.activeElement)) {
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
      }
    };
    look();
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

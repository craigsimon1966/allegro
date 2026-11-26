import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'Allegro Learning';
/** Screens whose heading is a marketing line rather than a page name. */
const TITLES: Record<string, string> = { '/': SITE, '/demo': `Try the demo · ${SITE}` };

/**
 * After each change of screen: names the browser tab after the page's heading (WCAG 2.4.2) and
 * moves focus to that heading, so screen readers announce the new page (WCAG 2.4.3).
 * The first load is left alone. Screens load lazily or wait on the AI, so it waits for the
 * heading to appear.
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
    // Watch the page until the new screen's heading appears. Screens that wait on the AI (the
    // week, a lesson) can show a progress screen with no heading for 30 seconds or more, so this
    // waits up to 2 minutes rather than a few frames.
    let observer: MutationObserver | null = null;
    let timer = 0;
    const stop = () => {
      observer?.disconnect();
      observer = null;
      window.clearTimeout(timer);
    };
    const look = () => {
      const h1 =
        document.querySelector<HTMLElement>('main h1') ?? document.querySelector<HTMLElement>('h1');
      const stale = moveFocus && h1 === lastH1.current && h1?.isConnected;
      if (!h1 || stale) return false;
      lastH1.current = h1;
      const name = h1.textContent?.trim();
      document.title = TITLES[pathname] ?? (name && name !== SITE ? `${name} · ${SITE}` : SITE);
      if (moveFocus && !h1.contains(document.activeElement)) {
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
      }
      return true;
    };
    if (!look()) {
      observer = new MutationObserver(() => {
        if (look()) stop();
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      timer = window.setTimeout(stop, 120_000);
    }
    return stop;
  }, [pathname]);

  return null;
}

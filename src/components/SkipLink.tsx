import type { MouseEvent } from 'react';

/** "Skip to main content" (WCAG 2.4.1). Hidden until it has keyboard focus. */
export function SkipLink() {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const main = document.getElementById('main');
    if (!main) return;
    e.preventDefault();
    // Focus the main region itself, so the next Tab starts inside it.
    main.setAttribute('tabindex', '-1');
    main.focus();
    main.scrollIntoView();
  };
  return (
    <a
      href="#main"
      onClick={onClick}
      className="sr-only border-2 border-ink bg-surface px-4 py-3 font-bold text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50"
    >
      Skip to main content
    </a>
  );
}

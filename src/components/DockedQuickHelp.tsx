import { lazy, Suspense } from 'react';

const QuickHelpPanel = lazy(() => import('@/features/help/QuickHelpPanel'));

/**
 * On laptop, Quick Help docks on the right of This week (SPEC 10.6, design/Desktop-Pathway).
 * Phone and tablet use the "Ask a question" slide-over instead.
 */
export function DockedQuickHelp() {
  return (
    <aside
      aria-label="Quick Help"
      className="no-print sticky top-0 hidden h-screen w-[340px] shrink-0 overflow-y-auto border-l-2 border-t-4 border-l-rule-strong border-t-plum-500 px-5 py-6 lg:block"
    >
      <Suspense fallback={<p role="status">Opening Quick Help…</p>}>
        <QuickHelpPanel headingLevel={2} />
      </Suspense>
    </aside>
  );
}

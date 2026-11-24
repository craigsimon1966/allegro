import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { QuickHelpButton } from './QuickHelpButton';

interface Props {
  children: ReactNode;
  /** Current loop step (1 to 6), shown in the laptop sidebar. */
  step?: number;
}

/** Teacher app frame: sidebar on laptop, bottom tabs plus "Ask a question" on phone and tablet. */
export function AppShell({ children, step }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar step={step} />
      <main id="main" className="min-w-0 flex-1 pb-36 lg:pb-0">
        {children}
      </main>
      <aside aria-label="Quick Help">
        <QuickHelpButton />
      </aside>
      <TabBar />
    </div>
  );
}

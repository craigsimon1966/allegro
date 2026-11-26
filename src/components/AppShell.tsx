import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { QuickHelpButton } from './QuickHelpButton';
import { StepSquares } from './StepSquares';

interface Props {
  children: ReactNode;
  /** Current loop step (1 to 6), shown in the laptop sidebar. */
  step?: number;
  /**
   * During setup and reflection a step counter replaces the tab bar's role on phone and tablet
   * (SPEC 10.6). Needs `step`.
   */
  setup?: boolean;
  /** Back link for the setup header. */
  backTo?: string;
}

/** Teacher app frame: sidebar on laptop; bottom tabs plus "Ask a question", or a step header during setup. */
export function AppShell({ children, step, setup = false, backTo }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar step={step} />
      <main id="main" className={`min-w-0 flex-1 ${setup ? 'pb-8' : 'pb-36'} lg:pb-0`}>
        {/* Phone and tablet: the logo heads every app screen (laptop has it in the sidebar). */}
        <div className="no-print flex items-center border-b border-rule px-4 py-2 lg:hidden">
          <Link to="/" className="inline-flex min-h-tap items-center no-underline">
            <img
              src="/brand/logo-green.svg"
              alt="Allegro Learning home"
              width={147}
              height={36}
              className="h-8 w-auto"
            />
          </Link>
        </div>
        {setup && step !== undefined && (
          <div className="flex items-center gap-3 border-b-2 border-rule-strong px-4 py-3 lg:hidden">
            {backTo && (
              <Link
                to={backTo}
                className="inline-flex h-tap w-tap items-center justify-center text-ink"
              >
                <ChevronLeft size={24} strokeWidth={1.5} aria-hidden="true" />
                <span className="sr-only">Back</span>
              </Link>
            )}
            <StepSquares current={step} showName={false} />
          </div>
        )}
        {children}
      </main>
      {!setup && (
        <>
          <aside aria-label="Quick Help" className="lg:hidden">
            <QuickHelpButton />
          </aside>
          <TabBar />
        </>
      )}
    </div>
  );
}

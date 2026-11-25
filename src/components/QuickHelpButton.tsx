import { lazy, Suspense, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { buttonClasses } from './buttonClasses';

const QuickHelpPanel = lazy(() => import('@/features/help/QuickHelpPanel'));

/**
 * "Ask a question" sits above the tab bar on phone and tablet (SPEC 10.6) and opens Quick Help
 * over the current screen, so a teacher in a unit or a lesson keeps their place (SPEC 7.8).
 * Phone: a sheet from the bottom, reachable one-handed. Tablet: a side sheet on the right.
 * Laptop has no button here; Quick Help is in the sidebar.
 */
export function QuickHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className={buttonClasses('ask', 'fixed bottom-[84px] right-5 z-10 lg:hidden')}
      >
        Ask a question
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink opacity-40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col border-t-2 border-rule-strong bg-surface sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:border-l-2 sm:border-t-0"
        >
          <div className="flex items-center justify-between border-b border-rule px-5 py-2">
            <Dialog.Title className="font-heading text-[19px] font-bold">Quick Help</Dialog.Title>
            <Dialog.Close className="inline-flex h-tap w-tap items-center justify-center text-ink">
              <X size={24} strokeWidth={1.5} aria-hidden="true" />
              <span className="sr-only">Close Quick Help</span>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 pb-8 pt-4">
            <Suspense fallback={<p role="status">Opening Quick Help…</p>}>
              <QuickHelpPanel headingLevel={2} onLeave={() => setOpen(false)} />
            </Suspense>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

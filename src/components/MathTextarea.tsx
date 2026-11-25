import { lazy, Suspense, useRef, useState, type TextareaHTMLAttributes } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Sigma, X } from 'lucide-react';
import { MathText } from './MathText';
import { equationAt, insertEquation } from '@/lib/mathInsert';

// The equation editor (MathLive) is large, so it loads only when a teacher opens it.
const EquationEditor = lazy(() => import('./EquationEditor'));

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'id'> & {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Show a live preview of the maths under the box. */
  preview?: boolean;
};

/**
 * A textarea with an "Insert maths" button. Equations are built in a visual editor (fractions,
 * powers, roots) and saved into the text as $...$, the same LaTeX the rest of Allegro renders
 * with KaTeX and the Word download turns into Word equations. With the cursor inside an
 * existing $...$, the button edits that equation.
 */
export function MathTextarea({
  id,
  value,
  onChange,
  preview = true,
  className = '',
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{ start: number; end: number; latex: string }>({
    start: 0,
    end: 0,
    latex: '',
  });

  const openEditor = () => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    setTarget(equationAt(value, start, end) ?? { start, end, latex: '' });
    setOpen(true);
  };

  const insert = (latex: string) => {
    const { text, caret } = insertEquation(value, target.start, target.end, latex);
    onChange(text);
    setOpen(false);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(caret, caret);
    });
  };

  const hasMaths = /\$[^$]+\$/.test(value);
  return (
    <div className="min-w-0 flex-1">
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        {...rest}
      />
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={openEditor}
          className="no-print mt-1 inline-flex min-h-tap items-center gap-1.5 font-bold text-plum-700 underline"
          aria-describedby={`${id}-maths-hint`}
        >
          <Sigma size={18} strokeWidth={1.5} aria-hidden="true" /> Insert maths
        </button>
        <span id={`${id}-maths-hint`} className="sr-only">
          Opens an equation editor. If the cursor is inside an equation, it edits that equation.
        </span>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink opacity-40" />
          <Dialog.Content
            aria-describedby={undefined}
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto border-t-2 border-rule-strong bg-surface px-5 pb-6 pt-2 sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-24 sm:w-[560px] sm:-translate-x-1/2 sm:border-2"
          >
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <Dialog.Title className="font-heading text-[19px] font-bold">
                {target.latex ? 'Edit equation' : 'Insert maths'}
              </Dialog.Title>
              <Dialog.Close className="inline-flex h-tap w-tap items-center justify-center text-ink">
                <X size={24} strokeWidth={1.5} aria-hidden="true" />
                <span className="sr-only">Close the equation editor</span>
              </Dialog.Close>
            </div>
            <Suspense
              fallback={
                <p role="status" className="py-6">
                  Opening the equation editor…
                </p>
              }
            >
              <EquationEditor
                initial={target.latex}
                onInsert={insert}
                onCancel={() => setOpen(false)}
              />
            </Suspense>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {preview && hasMaths && (
        <div className="math-preview no-print mt-2 border-l-2 border-rule pl-3">
          <p className="text-[13px] font-bold tracking-[0.1em] text-muted">PREVIEW</p>
          <MathText>{value}</MathText>
        </div>
      )}
    </div>
  );
}

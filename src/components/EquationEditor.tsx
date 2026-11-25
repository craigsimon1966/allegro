import { useEffect, useRef } from 'react';
import { MathfieldElement } from 'mathlive';
import { Button } from './Button';

// The visual equation editor (MathLive), loaded only when a teacher opens "Insert maths".
// MathLive draws with the KaTeX fonts the page already has, so no extra fonts download, and
// its sounds are off. Its own pop-up keyboard is off too: the buttons below do that job and
// work inside the dialog on phones, tablets and laptops.
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

const SHORTCUTS: { label: string; name: string; insert: string }[] = [
  { label: 'a/b', name: 'Fraction', insert: '\\frac{#@}{#?}' },
  { label: 'x²', name: 'Squared', insert: '#@^{2}' },
  { label: 'xⁿ', name: 'Power', insert: '#@^{#?}' },
  { label: '√', name: 'Square root', insert: '\\sqrt{#0}' },
  { label: '×', name: 'Times', insert: '\\times' },
  { label: '÷', name: 'Divide', insert: '\\div' },
  { label: '±', name: 'Plus or minus', insert: '\\pm' },
  { label: '≤', name: 'Less than or equal to', insert: '\\le' },
  { label: '≥', name: 'Greater than or equal to', insert: '\\ge' },
  { label: '≠', name: 'Not equal to', insert: '\\ne' },
  { label: 'π', name: 'Pi', insert: '\\pi' },
  { label: '°', name: 'Degrees', insert: '^{\\circ}' },
  { label: '( )', name: 'Brackets', insert: '\\left(#0\\right)' },
  { label: 'x₁', name: 'Subscript', insert: '#@_{#?}' },
];

export default function EquationEditor({
  initial,
  onInsert,
  onCancel,
}: {
  initial: string;
  onInsert: (latex: string) => void;
  onCancel: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const field = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    const mf = new MathfieldElement();
    mf.mathVirtualKeyboardPolicy = 'manual';
    mf.smartFence = true;
    mf.setAttribute('aria-label', 'Equation');
    mf.className = 'equation-field';
    mf.value = initial;
    mf.addEventListener('keydown', (e) => {
      // Enter inserts; Escape is left to the dialog.
      if (e.key === 'Enter') {
        e.preventDefault();
        onInsert(mf.getValue('latex-expanded'));
      }
    });
    host.current?.appendChild(mf);
    field.current = mf;
    requestAnimationFrame(() => mf.focus());
    return () => mf.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = (snippet: string) => {
    const mf = field.current;
    if (!mf) return;
    mf.executeCommand(['insert', snippet, { focus: true, selectionMode: 'placeholder' }]);
    mf.focus();
  };

  return (
    <div className="pt-3">
      <p className="text-[15px] text-muted">
        Type the maths, or use the buttons. For example, type 3/4 for a fraction or x^2 for a power.
      </p>
      <div
        ref={host}
        className="mt-3 min-h-[56px] border-2 border-ink bg-field px-2 py-1 text-[24px] text-ink"
      />
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Maths symbols">
        {SHORTCUTS.map((s) => (
          <button
            key={s.name}
            type="button"
            title={s.name}
            aria-label={s.name}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => add(s.insert)}
            className="inline-flex h-tap min-w-tap items-center justify-center rounded border border-rule-strong bg-field px-2 text-[18px] text-ink"
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <Button onClick={() => onInsert(field.current?.getValue('latex-expanded') ?? '')}>
          {initial ? 'Update equation' : 'Insert equation'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

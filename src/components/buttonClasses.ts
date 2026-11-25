// Shared button styles (SPEC 10.1 button rules).
export type ButtonVariant = 'primary' | 'secondary' | 'ask' | 'ink';

const BASE =
  'inline-flex min-h-tap items-center justify-center gap-2 rounded px-[18px] text-base font-bold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  // Green 700, white text (5.59:1)
  primary: 'bg-green-700 text-white hover:bg-green-800',
  // Paper background, 2px plum border, plum 700 text (brand accent, 26 Nov)
  secondary: 'border-2 border-plum-500 bg-surface text-plum-700 hover:bg-plum-100',
  // AI actions: solid plum, white text (5.88:1)
  ask: 'bg-plum-500 text-white hover:bg-plum-700',
  // Ink button, used on sage bands where green would fail contrast
  ink: 'bg-ink text-surface hover:bg-green-900',
};

export function buttonClasses(variant: ButtonVariant = 'primary', extra = '') {
  return [BASE, VARIANTS[variant], extra].join(' ').trim();
}

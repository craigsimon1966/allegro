import tokensCss from '@/styles/tokens.css?raw';

// Colours for the downloaded files (Word, PowerPoint), read from the design tokens so
// tokens.css stays the only place with raw colour values. Office files want "RRGGBB".

export function tokenColour(name: string, css: string = tokensCss): string {
  const m = css.match(new RegExp(`--${name}:\\s*#([0-9a-fA-F]{6})\\b`));
  if (!m) throw new Error(`No colour token --${name}`);
  return m[1]!.toUpperCase();
}

export const PRINT = {
  ink: tokenColour('ink'),
  muted: tokenColour('muted'),
  plum: tokenColour('plum-700'),
  rule: tokenColour('rule'),
  white: tokenColour('white'),
  plumLight: tokenColour('plum-100'),
};

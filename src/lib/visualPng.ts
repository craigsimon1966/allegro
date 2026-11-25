import { parseVisual, visualSvg, type Palette } from '@shared/visuals';

// Turns a ```visual diagram into a PNG for the Word download. Word and Google Docs can't use
// CSS variables, so the colours are read from the live tokens (tokens.css) first.

export interface VisualImage {
  data: Uint8Array;
  width: number;
  height: number;
}

function printPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    ink: token('--ink'),
    muted: token('--muted'),
    grid: token('--grid'),
    fill: token('--plum-100'),
    accent: token('--plum-500'),
    line: token('--green-700'),
    paper: token('--white'),
    font: 'Calibri, Arial, sans-serif',
  };
}

export async function visualToPng(raw: string, scale = 2): Promise<VisualImage | null> {
  const parsed = parseVisual(raw);
  if (!parsed.ok) return null;
  const { svg, width, height } = visualSvg(parsed.spec, printPalette());
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) return null;
    return { data: new Uint8Array(await blob.arrayBuffer()), width, height };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

import { visualBlocksIn } from '@shared/visuals';
import { visualToPng, type VisualImage } from './visualPng';

/**
 * Diagrams drawn as pictures for the Word and PowerPoint downloads, keyed by their raw
 * ```visual spec. Drawing needs the browser and is async, so `prepareVisuals` fills this before
 * a file is built; a diagram that isn't here goes in as a written description.
 */
const VISUALS = new Map<string, VisualImage>();

export function setVisualImage(raw: string, img: VisualImage) {
  VISUALS.set(raw, img);
}

export function visualImage(raw: string): VisualImage | undefined {
  return VISUALS.get(raw);
}

/** Draws every diagram in these Markdown strings, at 3x so it stays sharp on a smart board. */
export async function prepareVisuals(mds: string[]) {
  for (const raw of new Set(mds.flatMap(visualBlocksIn))) {
    if (VISUALS.has(raw)) continue;
    const img = await visualToPng(raw, 3);
    if (img) VISUALS.set(raw, img);
  }
}

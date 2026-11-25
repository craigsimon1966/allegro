import diagnosticsFile from '../content/diagnostics.json';
import type { CheckItem } from './types';

export interface DiagnosticItem extends CheckItem {
  topicTag: string;
  reviewedBy: string | null;
}

export type DiagnosticResult = 'solid' | 'refresh' | 'start_here';

export const DIAGNOSTICS: DiagnosticItem[] = diagnosticsFile.items as DiagnosticItem[];

export const itemsForTag = (tag: string) => DIAGNOSTICS.filter((d) => d.topicTag === tag);

/** Numeric answers allow "1.50", "$1.50" and "1.5"; MCQ answers must match the option. */
export function isCorrect(item: CheckItem, given: string): boolean {
  if (item.type === 'numeric') {
    const n = Number(given.replace(/[$,\s]/g, ''));
    return Number.isFinite(n) && Math.abs(n - Number(item.answer)) < 1e-9;
  }
  return given.trim() === item.answer.trim();
}

/** Never a score out of 100 (SPEC 7.4). */
export function resultFor(correct: number, total: number): DiagnosticResult {
  if (total === 0) return 'refresh';
  const ratio = correct / total;
  if (ratio === 1) return 'solid';
  if (ratio >= 0.5) return 'refresh';
  return 'start_here';
}

export const RESULT_LABELS: Record<DiagnosticResult, string> = {
  solid: 'Solid',
  refresh: 'Worth a refresh',
  start_here: 'Start here',
};

/**
 * Honest, kind calibration message comparing the teacher's rating with the check (SPEC 7.4, P5).
 * The rating is concern, 1 (not a concern) to 5 (a big concern), so high concern with a solid
 * result means they know more than they think (decided 26 Nov 2026, see docs/decisions.md).
 */
export function calibrationMessage(
  concern: number | null,
  result: DiagnosticResult,
  topic: string,
): string {
  const rated = concern ? `You rated this ${concern} of 5 as a concern. ` : '';
  const t = topic.charAt(0).toLowerCase() + topic.slice(1);
  if (result === 'solid') {
    if (concern !== null && concern >= 4)
      return `${rated}The check suggests you know more than you think about ${t}. That's very common when you're new to a subject.`;
    return `${rated}The check agrees: ${t} looks solid. We'll focus on teaching it.`;
  }
  if (result === 'refresh') {
    if (concern !== null && concern <= 2)
      return `${rated}The check suggests ${t} is worth a refresh. That's very common, and a short unit will cover it.`;
    return `${rated}Your check agrees: ${t} is worth a refresh. Very common.`;
  }
  if (concern !== null && concern <= 3)
    return `${rated}The check suggests starting from the beginning with ${t}. Lots of teachers find the same, and we'll start with the basics.`;
  return `${rated}Let's start here with ${t}. We'll begin with the basics, one short unit at a time.`;
}

import type { CheckItem, CheckQuestion } from './types';

// Quick check flow for one question (SPEC 7.6, adaptive retry). Pure, so the unit player and the
// tests share it. An incremental question is not moved on after a wrong answer:
//   wrong once  -> feedback tied to the likely misconception, then a parallel item
//   wrong twice -> the parallel's worked solution, then one more parallel or "move on for now"
//   wrong three times -> the worked solution, and the skill is flagged as a need
// A question that is not incremental keeps the old behaviour: one answer, feedback, move on.

export const MAX_PARALLELS = 2;

/** How an item ended, recorded so Allegro can feed it into the teacher's needs. */
export type CheckOutcome =
  'first_try' | 'after_feedback' | 'after_worked_solution' | 'needs_support' | 'wrong';

export interface CheckAttempt {
  itemId: string;
  skill: string | null;
  incremental: boolean;
  outcome: CheckOutcome;
  /** Questions answered, including parallels. */
  tries: number;
  /** Misconceptions the wrong answers pointed to, in order, without repeats. */
  misconceptionIds: string[];
  at: string;
}

export const OUTCOME_LABELS: Record<CheckOutcome, string> = {
  first_try: 'Right first time',
  after_feedback: 'Right after feedback',
  after_worked_solution: 'Right after a worked solution',
  needs_support: 'Worth another look',
  wrong: 'Not yet',
};

/** Outcomes that mean the skill should come back as a need. */
export const needsSupport = (o: CheckOutcome) => o === 'needs_support' || o === 'wrong';

export const normaliseAnswer = (s: string) => s.replace(/[$\s]/g, '').toLowerCase();

export const isCorrect = (q: CheckQuestion, value: string) =>
  normaliseAnswer(value) === normaliseAnswer(q.answer);

/** Feedback for a wrong answer: the targeted entry if there is one, otherwise the general one. */
export function wrongFeedback(
  q: CheckQuestion,
  value: string,
): { text: string; misconceptionId: string | null } {
  const hit = (q.wrongAnswers ?? []).find(
    (w) => normaliseAnswer(w.answer) === normaliseAnswer(value),
  );
  return hit
    ? { text: hit.feedback, misconceptionId: hit.misconceptionId ?? null }
    : { text: q.feedbackIncorrect, misconceptionId: null };
}

export interface FlowState {
  /** 0 is the original question; 1 and 2 are its parallels. */
  step: number;
  phase: 'answering' | 'feedback' | 'done';
  /** The last answer given and whether it was right. */
  last: { value: string; correct: boolean } | null;
  tries: number;
  misconceptionIds: string[];
  outcome: CheckOutcome | null;
}

export const startFlow = (): FlowState => ({
  step: 0,
  phase: 'answering',
  last: null,
  tries: 0,
  misconceptionIds: [],
  outcome: null,
});

const parallelsOf = (item: CheckItem) =>
  item.incremental ? (item.parallels ?? []).slice(0, MAX_PARALLELS) : [];

/** The question being asked at this step. */
export function questionAt(item: CheckItem, step: number): CheckQuestion {
  return step === 0 ? item : (parallelsOf(item)[step - 1] ?? item);
}

/** True when another parallel item is still available after this step. */
export const hasNextParallel = (item: CheckItem, step: number) => step < parallelsOf(item).length;

export function answerFlow(item: CheckItem, s: FlowState, value: string): FlowState {
  if (s.phase !== 'answering') return s;
  const q = questionAt(item, s.step);
  const correct = isCorrect(q, value);
  const tries = s.tries + 1;
  const mis = correct ? null : wrongFeedback(q, value).misconceptionId;
  const misconceptionIds =
    mis && !s.misconceptionIds.includes(mis) ? [...s.misconceptionIds, mis] : s.misconceptionIds;
  const base = { ...s, last: { value, correct }, tries, misconceptionIds };
  if (correct) {
    const outcome: CheckOutcome =
      s.step === 0 ? 'first_try' : s.step === 1 ? 'after_feedback' : 'after_worked_solution';
    return { ...base, phase: 'done', outcome };
  }
  if (!item.incremental || parallelsOf(item).length === 0)
    return { ...base, phase: 'done', outcome: 'wrong' };
  if (hasNextParallel(item, s.step)) return { ...base, phase: 'feedback' };
  return { ...base, phase: 'done', outcome: 'needs_support' };
}

/** Moves on to the next parallel item. */
export function nextParallel(item: CheckItem, s: FlowState): FlowState {
  if (s.phase !== 'feedback' || !hasNextParallel(item, s.step)) return s;
  return { ...s, step: s.step + 1, phase: 'answering', last: null };
}

/** "Move on for now" after a second wrong answer: the skill is flagged as a need. */
export function moveOnForNow(s: FlowState): FlowState {
  if (s.phase !== 'feedback' || s.step === 0) return s;
  return { ...s, phase: 'done', outcome: 'needs_support' };
}

export function toAttempt(item: CheckItem, s: FlowState, at = new Date()): CheckAttempt | null {
  if (s.phase !== 'done' || !s.outcome) return null;
  return {
    itemId: item.id,
    skill: item.skill ?? null,
    incremental: !!item.incremental,
    outcome: s.outcome,
    tries: s.tries,
    misconceptionIds: s.misconceptionIds,
    at: at.toISOString(),
  };
}

/** Index of the last question to show: everything after an unresolved incremental item waits. */
export function visibleCount(items: CheckItem[], resolved: Record<string, boolean>): number {
  for (let i = 0; i < items.length; i++)
    if (items[i]!.incremental && !resolved[items[i]!.id]) return i + 1;
  return items.length;
}

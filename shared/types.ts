// Content model from SPEC 9.1, plus the review fields from TECH_SPEC 10.3.

export type Domain = 'CK' | 'PK' | 'PCK' | 'ASSESSMENT' | 'WELLBEING' | 'CONTEXT';
export type Format = 'text' | 'worked_example' | 'video' | 'reflective_task' | 'interactive';
export type Audience =
  'out_of_field' | 'early_career' | 'casual' | 'experienced' | 'leader' | 'primary' | 'secondary';

/** Feedback for one likely wrong answer, tied to the misconception behind it. */
export interface WrongAnswerFeedback {
  /** The wrong answer as chosen or typed (compared without spaces, $ or case). */
  answer: string;
  feedback: string;
  misconceptionId?: string;
}

/** A question in a unit's quick check, or a parallel version of one. */
export interface CheckQuestion {
  id: string;
  stemMd: string;
  type: 'mcq' | 'numeric' | 'short';
  options?: string[];
  answer: string;
  feedbackCorrect: string;
  /** Used when the wrong answer has no entry in wrongAnswers. */
  feedbackIncorrect: string;
  wrongAnswers?: WrongAnswerFeedback[];
  /** Step-by-step solution, shown after a second wrong answer. */
  workedSolutionMd?: string;
}

/** Same skill and level as the question it follows, with different numbers. */
export interface ParallelItem extends CheckQuestion {
  workedSolutionMd: string;
}

export interface CheckItem extends CheckQuestion {
  /**
   * The questions after this one build on it. A wrong answer is not moved on: the teacher gets
   * targeted feedback and a parallel item (up to two) before the next question opens.
   */
  incremental?: boolean;
  /** What the question checks, e.g. "algebra.table-to-rule". Groups attempts across items. */
  skill?: string;
  /** Parallel items, in the order they are offered. Required when incremental is true. */
  parallels?: ParallelItem[];
}

export interface MicroUnit {
  id: string;
  moduleId: string;
  title: string;
  domain: Domain;
  tags: string[];
  audience: Audience[];
  yearLevels: string[];
  durationMinutes: number;
  format: Format[];
  difficulty: 1 | 2 | 3;
  /** 'AC9-TODO' / 'NSW-TODO' until a human verifies them. Never invented. */
  curriculumRefs: { ac9: string[]; nsw: string[] };
  aitslStandards: string[];
  hook: string;
  coreIdeaMd: string;
  workedExampleMd?: string;
  misconceptionIds: string[];
  checkItems: CheckItem[];
  tryTomorrow: string;
  reflectPrompt: string;
  /** Set by hand by the human reviewer only. Claude Code never sets this. */
  reviewedBy: string | null;
  reviewedOn?: string;
  reviewedHash?: string;
}

export interface Misconception {
  id: string;
  topicTag: string;
  studentSays: string;
  whyItHappens: string;
  howToRespond: string;
  diagnosticQuestion: string;
}

export interface Module {
  id: string;
  title: string;
  summary: string;
  unitIds: string[];
}

export interface SchoolProfile {
  id: string;
  name: string;
  sector: string;
  location: string;
  size: string;
  priorities: string[];
  fictional: true;
}

// Content model from SPEC 9.1, plus the review fields from TECH_SPEC 10.3.

export type Domain = 'CK' | 'PK' | 'PCK' | 'ASSESSMENT' | 'WELLBEING' | 'CONTEXT';
export type Format = 'text' | 'worked_example' | 'video' | 'reflective_task' | 'interactive';
export type Audience =
  'out_of_field' | 'early_career' | 'casual' | 'experienced' | 'leader' | 'primary' | 'secondary';

export interface CheckItem {
  id: string;
  stemMd: string;
  type: 'mcq' | 'numeric' | 'short';
  options?: string[];
  answer: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
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

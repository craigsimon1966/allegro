// Australian states and territories, and the maths curriculum each one teaches from.
// NSW, Victoria and WA publish their own versions; the others use the Australian Curriculum v9.
// Codes are never invented: a state's codes show as a -TODO placeholder until a person checks
// them (docs/curriculum-todo.md).

export type StateId = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

export interface StateInfo {
  id: StateId;
  name: string;
  /** The curriculum teachers in this state plan from. */
  curriculum: string;
  /** Short label for the curriculum row on a lesson plan. */
  label: string;
  /** Placeholder until that state's codes are looked up. Null when it is AC v9 itself. */
  placeholder: string | null;
}

export const STATES: StateInfo[] = [
  {
    id: 'NSW',
    name: 'New South Wales',
    curriculum: 'NSW Mathematics K–10 Syllabus (NESA)',
    label: 'NSW syllabus',
    placeholder: 'NSW-TODO',
  },
  {
    id: 'VIC',
    name: 'Victoria',
    curriculum: 'Victorian Curriculum F–10 Version 2.0 (VCAA)',
    label: 'Victorian Curriculum 2.0',
    placeholder: 'VC2-TODO',
  },
  {
    id: 'QLD',
    name: 'Queensland',
    curriculum: 'Australian Curriculum v9',
    label: 'AC v9',
    placeholder: null,
  },
  {
    id: 'WA',
    name: 'Western Australia',
    curriculum: 'Western Australian Curriculum (SCSA)',
    label: 'WA Curriculum',
    placeholder: 'WA-TODO',
  },
  {
    id: 'SA',
    name: 'South Australia',
    curriculum: 'Australian Curriculum v9',
    label: 'AC v9',
    placeholder: null,
  },
  {
    id: 'TAS',
    name: 'Tasmania',
    curriculum: 'Australian Curriculum v9',
    label: 'AC v9',
    placeholder: null,
  },
  {
    id: 'ACT',
    name: 'Australian Capital Territory',
    curriculum: 'Australian Curriculum v9',
    label: 'AC v9',
    placeholder: null,
  },
  {
    id: 'NT',
    name: 'Northern Territory',
    curriculum: 'Australian Curriculum v9',
    label: 'AC v9',
    placeholder: null,
  },
];

export const STATE_IDS = STATES.map((s) => s.id) as [StateId, ...StateId[]];

export const stateById = (id: string | null | undefined) => STATES.find((s) => s.id === id);

/** One line for AI prompts, so wording follows the teacher's curriculum. Never asks for codes. */
export function curriculumContext(state: string | null | undefined): string {
  const s = stateById(state);
  return s
    ? `The teacher works in ${s.name}, which uses the ${s.curriculum}. Use its terms for year levels and topics. Never give curriculum codes.`
    : '';
}

// Student-name detector (SPEC 7.3, TECH_SPEC 5.4). Used by the intake screen (warning) and by
// /api/diagnose (rejection). It looks for a capitalised "Firstname Lastname" pair near words
// that point at a child. It is a guard rail, not a guarantee, so the prompt also flags PII.

const CHILD_WORDS =
  /\b(student|students|kid|kids|child|children|boy|boys|girl|girls|pupil|pupils|son|daughter|he|she|his|her)\b/i;

// Two capitalised words, e.g. "Jayden Smith". Excludes common non-name pairs below.
const FULL_NAME = /\b([A-Z][a-z]{1,20})\s+([A-Z][a-z]{1,20}(?:-[A-Z][a-z]{1,20})?)\b/g;

const NOT_NAMES = new Set([
  'Year',
  'Term',
  'Week',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'New',
  'South',
  'Wales',
  'Western',
  'Northern',
  'Australia',
  'Australian',
  'Queensland',
  'Victoria',
  'Tasmania',
  'Territory',
  'Capital',
  'High',
  'School',
  'Public',
  'Primary',
  'College',
  'Catholic',
  'Grammar',
  'Christian',
  'Anglican',
  'Mathematics',
  'Maths',
  'English',
  'Science',
  'History',
  'Geography',
  'Physical',
  'Education',
  'Health',
  'Curriculum',
  'Learning',
  'Support',
  'Head',
  'Teacher',
  'Deputy',
  'Principal',
  'Allegro',
  'Stage',
  'Standard',
  'Advanced',
  'Extension',
  'General',
  'Methods',
  'Specialist',
  'Further',
  'Foundation',
  // Maths and school words teachers often write in Title Case ("Linear Relationships").
  'Linear',
  'Relationships',
  'Algebra',
  'Number',
  'Fractions',
  'Decimals',
  'Percentages',
  'Ratio',
  'Ratios',
  'Rates',
  'Index',
  'Laws',
  'Theorem',
  'Pythagoras',
  'Probability',
  'Statistics',
  'Measurement',
  'Geometry',
  'Trigonometry',
  'Equations',
  'Place',
  'Value',
  'Times',
  'Tables',
  'Unit',
  'Lesson',
  'Plan',
  'Assessment',
  'Task',
  'Exam',
  'Test',
  'Quiz',
  'Homework',
  'Library',
  'Room',
  'Block',
  'Day',
  'Sports',
  'Carnival',
  'The',
  'I',
  'We',
  'My',
  'Our',
  'In',
  'On',
  'At',
  'This',
  'Last',
  'Next',
  'It',
  'And',
  'But',
  'So',
]);

// Endings that are common for nouns and rare for names, e.g. "Relationships", "Division".
const NOUN_ENDINGS = /(tion|sion|ships?|ment|ness|ity|ics|ology|ions)$/;

export function findLikelyStudentNames(text: string): string[] {
  if (!CHILD_WORDS.test(text)) return [];
  const found: string[] = [];
  for (const m of text.matchAll(FULL_NAME)) {
    const [, first, last] = m as unknown as [string, string, string];
    if (NOT_NAMES.has(first) || NOT_NAMES.has(last.split('-')[0] ?? '')) continue;
    if (NOUN_ENDINGS.test(first) || NOUN_ENDINGS.test(last)) continue;
    found.push(`${first} ${last}`);
  }
  return [...new Set(found)];
}

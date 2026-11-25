import type { Diagnosis, Guided, Need } from './schemas';
import { tagById } from './tags';
import { topicFitsYear } from './curriculum';

// Rules-based diagnosis used when the AI is unavailable or returns invalid output twice
// (SPEC 8.3 "fall back to the guided form"). It is deliberately simple and says so in the summary.

interface Rule {
  tag: string;
  test: (text: string, g: Guided) => boolean;
  priority: Need['priority'];
  evidence: string;
}

const has = (text: string, ...words: string[]) =>
  words.some((w) => text.toLowerCase().includes(w.toLowerCase()));

const isPrimary = (g: Guided) =>
  (g.yearLevels ?? []).some((y) => ['F', 'K', 'Prep', '1', '2', '3', '4', '5', '6'].includes(y));

const RULES: Rule[] = [
  {
    tag: 'algebra.linear',
    priority: 'now',
    evidence: 'You mentioned linear relationships, graphs or gradient.',
    test: (t) => has(t, 'linear', 'gradient', 'slope', 'y = mx', 'graph'),
  },
  {
    tag: 'algebra.foundations',
    priority: 'now',
    evidence: 'You mentioned algebra.',
    test: (t) => has(t, 'algebra', 'pronumeral', 'equation', 'variable') && !has(t, 'linear'),
  },
  {
    tag: 'number.proportional',
    priority: 'soon',
    evidence: 'You mentioned ratio, rates or percentages.',
    test: (t) => has(t, 'ratio', 'rate', 'percent', 'proportion', 'fraction'),
  },
  {
    tag: 'primary.early-number',
    priority: 'now',
    evidence: 'You are teaching early years maths.',
    test: (t, g) => isPrimary(g) || has(t, 'year 1', 'kindergarten', 'prep'),
  },
  {
    tag: 'primary.routines',
    priority: 'now',
    evidence: 'You are new to an early years class.',
    test: (t, g) => isPrimary(g) || has(t, 'year 1', 'kindergarten', 'prep'),
  },
  {
    tag: 'pck.algebra-misconceptions',
    priority: 'now',
    evidence: 'You are teaching maths outside your trained subject.',
    test: (t, g) =>
      !isPrimary(g) &&
      (g.role === 'out_of_field' || has(t, 'out of field', 'not a maths teacher', 'pe teacher')),
  },
  {
    tag: 'pk.routines',
    priority: 'now',
    evidence: 'You mentioned behaviour or routines.',
    test: (t) => has(t, 'behaviour', 'behavior', 'routine', 'manage', 'settle', 'noisy'),
  },
  {
    tag: 'pck.differentiation',
    priority: 'soon',
    evidence: 'You mentioned a wide range of students.',
    test: (t) =>
      has(t, 'differentiat', 'mixed ability', 'mixed readiness', 'range', 'extension', 'struggl'),
  },
  {
    tag: 'pk.checking-understanding',
    priority: 'soon',
    evidence: 'Every new teacher of maths benefits from quick checks for understanding.',
    test: (_t, g) => !isPrimary(g),
  },
  {
    tag: 'wellbeing.workload',
    priority: 'later',
    evidence: 'You mentioned stress or workload.',
    test: (t) =>
      has(t, 'overwhelm', 'stress', 'exhausted', 'burnt out', 'burned out', 'anxious', 'workload'),
  },
  {
    tag: 'context.out-of-field',
    priority: 'later',
    evidence: 'You are teaching outside your trained subject.',
    test: (t, g) =>
      g.role === 'out_of_field' || has(t, 'out of field', 'pe teacher', 'not trained'),
  },
  {
    tag: 'context.regional',
    priority: 'later',
    evidence: 'You work in a regional, rural or remote school.',
    test: (t, g) =>
      ['regional', 'rural', 'remote'].includes(g.locationType ?? '') ||
      has(t, 'regional', 'rural', 'remote', 'country'),
  },
];

const DEFAULT_TAGS = [
  'pk.checking-understanding',
  'pk.explicit-instruction',
  'assessment.success-criteria',
];

export function fallbackDiagnosis(situationText: string, guided: Guided = {}): Diagnosis {
  // Same rule as the AI path: a topic from another year is never suggested.
  const years = guided.yearLevels ?? [];
  const fits = (tag: string) => !years.length || years.some((y) => topicFitsYear(tag, y));
  const matched = RULES.filter((r) => fits(r.tag) && r.test(situationText, guided));
  // Keep 3 to 6 needs and at most 3 "now", as the AI is asked to (SPEC 8.6).
  let nowCount = 0;
  const needs: Need[] = matched.slice(0, 6).map((r, i) => {
    const tag = tagById(r.tag);
    let priority = r.priority;
    if (priority === 'now' && ++nowCount > 3) priority = 'soon';
    return {
      id: `fb-${i + 1}`,
      domain: tag?.domain ?? 'PK',
      topic: tag?.label ?? r.tag,
      catalogue_tags: [r.tag],
      evidence: r.evidence,
      priority,
    };
  });
  // Pad to at least 3 with needs that help any teacher new to a class.
  for (const tag of DEFAULT_TAGS) {
    if (needs.length >= 3) break;
    if (needs.some((n) => n.catalogue_tags.includes(tag))) continue;
    const t = tagById(tag);
    needs.push({
      id: `fb-${needs.length + 1}`,
      domain: t?.domain ?? 'PK',
      topic: t?.label ?? tag,
      catalogue_tags: [tag],
      evidence: 'A good starting point for any teacher.',
      priority: needs.some((n) => n.priority === 'now') ? 'soon' : 'now',
    });
  }
  return {
    summary:
      "We couldn't reach Allegro's AI just now, so these needs come from your answers to the guided questions. Edit anything that doesn't fit.",
    context: {
      role: guided.role ?? 'experienced',
      subject: guided.subject ?? 'Mathematics',
      year_levels: guided.yearLevels ?? [],
      school_type: guided.schoolType ?? 'unknown',
      location_type: guided.locationType ?? 'unknown',
      timeframe_weeks: guided.weeks ?? null,
      hours_per_week: guided.hoursPerWeek ?? null,
    },
    needs,
    clarifying_questions: [],
    safety_flags: [],
  };
}

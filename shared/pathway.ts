import type { MicroUnit } from './types';

// Rules-based pathway (SPEC 7.5, TECH_SPEC pathway fallback). Pure, so it runs the same
// in the browser and in tests. The time budget and teaching-day rules are enforced here.

export interface PathwayNeed {
  id: string;
  topic: string;
  evidence: string;
  priority: 'now' | 'soon' | 'later';
  catalogue_tags: string[];
  /** The teacher's own rating, 1 (not a concern) to 5 (a big concern). Null or absent if unrated. */
  concern?: number | null;
}

export interface PathwayItem {
  unitId: string;
  needId: string;
  reason: string;
  /** ISO date (YYYY-MM-DD) of the day the unit is planned for. */
  scheduledFor: string;
  sortOrder: number;
}

export interface PathwayInput {
  needs: PathwayNeed[];
  units: MicroUnit[];
  hoursPerWeek: number;
  /** How many days a week the teacher teaches (1 to 5), or null if not given. */
  teachingDaysPerWeek: number | null;
  /** Monday of the week, YYYY-MM-DD. */
  weekStart: string;
  /** The year levels the teacher teaches. Units for other years are never scheduled. */
  yearLevels?: string[];
  /** Year levels that are new to the teacher. Units for these years come first for each need. */
  focusYears?: string[];
}

const PRIORITY_RANK = { now: 0, soon: 1, later: 2 } as const;
const BANDS = ['now', 'soon', 'later'] as const;

/**
 * The band a need is scheduled in. A big concern (4 or 5) moves it up one band, so what worries
 * the teacher most comes first in the week.
 */
export function effectivePriority(need: PathwayNeed): PathwayNeed['priority'] {
  const rank = PRIORITY_RANK[need.priority];
  return (need.concern ?? 0) >= 4 ? BANDS[Math.max(0, rank - 1)]! : need.priority;
}

/** Needs in scheduling order: band first, then the teacher's concern, highest first. Stable. */
export function orderNeeds(needs: PathwayNeed[]): PathwayNeed[] {
  return [...needs].sort(
    (a, b) =>
      PRIORITY_RANK[effectivePriority(a)] - PRIORITY_RANK[effectivePriority(b)] ||
      (b.concern ?? 0) - (a.concern ?? 0),
  );
}

const PRIMARY_YEARS = ['F', '1', '2', '3', '4', '5', '6'];

/**
 * Does a unit suit a teacher of these years? A unit for set years must share one; a general unit
 * marked for primary or secondary teachers must match the phase. No years given: every unit.
 */
export function unitFitsYears(unit: MicroUnit, years: string[] | undefined): boolean {
  if (!years?.length) return true;
  if (unit.yearLevels.length) return unit.yearLevels.some((y) => years.includes(y));
  const primary = years.some((y) => PRIMARY_YEARS.includes(y));
  const secondary = years.some((y) => !PRIMARY_YEARS.includes(y));
  const forPrimary = unit.audience.includes('primary');
  const forSecondary = unit.audience.includes('secondary');
  if (forPrimary && !forSecondary) return primary;
  if (forSecondary && !forPrimary) return secondary;
  return true;
}

/**
 * The weekdays (1 = Monday) learning is first planned for. We only know how many days a teacher
 * teaches, not which, so the days off are spread through the week. The teacher can move any unit.
 */
export function learningDays(teachingDaysPerWeek: number | null | undefined): number[] {
  const off = 5 - (teachingDaysPerWeek ?? 5);
  return (
    ({ 1: [5], 2: [2, 5], 3: [1, 3, 5], 4: [1, 2, 4, 5] } as Record<number, number[]>)[off] ?? [
      1, 2, 3, 4, 5,
    ]
  );
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return dt.toISOString().slice(0, 10);
}

/** Monday of the current week in Australia/Sydney (spec-issues G10). */
export function sydneyWeekStart(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const iso = `${get('year')}-${get('month')}-${get('day')}`;
  const idx = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
  return addDays(iso, -Math.max(0, idx));
}

function reasonFor(need: PathwayNeed): string {
  const why = need.evidence.trim();
  return why ? `You told us: "${why}"` : `This builds on your need: ${need.topic}.`;
}

/** A unit the AI chose, before the code checks it (TECH_SPEC 7.3). */
export interface PathwayPick {
  unitId: string;
  needId: string;
  reason: string;
}

type Picked = { unit: MicroUnit; need: PathwayNeed; reason: string };

function pickByRules(input: PathwayInput, budget: number): Picked[] {
  const needs = orderNeeds(input.needs);

  // Units per need, easiest first. A unit is used once, for the most urgent need it matches.
  const used = new Set<string>();
  const queues = needs.map((need) => ({
    need,
    units: input.units
      .filter((u) => u.tags.some((t) => need.catalogue_tags.includes(t)))
      .sort((a, b) => {
        const primary = (u: MicroUnit) => (need.catalogue_tags.includes(u.tags[0] ?? '') ? 0 : 1);
        const focus = (u: MicroUnit) =>
          input.focusYears?.length && u.yearLevels.some((y) => input.focusYears!.includes(y))
            ? 0
            : 1;
        return (
          primary(a) - primary(b) ||
          focus(a) - focus(b) ||
          a.difficulty - b.difficulty ||
          a.id.localeCompare(b.id)
        );
      }),
  }));

  // Take units need by need within each priority band, but give every "now" need its first
  // unit before any need gets a second, so the week isn't all one topic.
  const picked: Picked[] = [];
  let minutes = 0;
  for (const band of ['now', 'soon', 'later'] as const) {
    const bandQueues = queues.filter((q) => effectivePriority(q.need) === band);
    let progress = true;
    while (progress) {
      progress = false;
      for (const q of bandQueues) {
        while (q.units.length && used.has(q.units[0]!.id)) q.units.shift();
        const u = q.units.shift();
        if (!u) continue;
        progress = true;
        if (minutes + u.durationMinutes > budget) continue;
        used.add(u.id);
        minutes += u.durationMinutes;
        picked.push({ unit: u, need: q.need, reason: reasonFor(q.need) });
      }
    }
  }
  return picked;
}

/** Keeps only real units and needs, each unit once, inside the time budget. */
function checkPicks(picks: PathwayPick[], input: PathwayInput, budget: number): Picked[] {
  const used = new Set<string>();
  const out: Picked[] = [];
  let minutes = 0;
  for (const p of picks) {
    const unit = input.units.find((u) => u.id === p.unitId);
    const need = input.needs.find((n) => n.id === p.needId);
    if (!unit || !need || used.has(unit.id)) continue;
    if (minutes + unit.durationMinutes > budget) continue;
    used.add(unit.id);
    minutes += unit.durationMinutes;
    const reason = p.reason
      .replace(/\u2014/g, ', ')
      .trim()
      .slice(0, 280);
    out.push({ unit, need, reason: reason || reasonFor(need) });
  }
  return out;
}

/**
 * The week of learning. With `picks` (from the AI), the code still enforces the catalogue,
 * the time budget and the days; with none, or none that survive the checks, it uses rules.
 */
export function buildPathway(raw: PathwayInput, picks?: PathwayPick[]): PathwayItem[] {
  const input = { ...raw, units: raw.units.filter((u) => unitFitsYears(u, raw.yearLevels)) };
  const budget = Math.round(input.hoursPerWeek * 60);
  const checked = picks ? checkPicks(picks, input, budget) : [];
  let picked = checked.length ? checked : pickByRules(input, budget);
  // When the teacher has rated their concerns, those ratings set the order of the week,
  // whatever order the AI suggested. Unrated needs (the demo teachers) keep the order as chosen.
  if (checked.length && input.needs.some((n) => n.concern != null)) {
    const order = orderNeeds(input.needs).map((n) => n.id);
    picked = [...picked].sort((a, b) => order.indexOf(a.need.id) - order.indexOf(b.need.id));
  }

  // Learning is spread over as many days as the teacher has off; with none, across the week.
  const days = learningDays(input.teachingDaysPerWeek);
  const perDay = Math.ceil(picked.length / days.length);
  return picked.map(({ unit, need, reason }, i) => ({
    unitId: unit.id,
    needId: need.id,
    reason,
    scheduledFor: addDays(
      input.weekStart,
      days[Math.min(days.length - 1, Math.floor(i / perDay))]! - 1,
    ),
    sortOrder: i,
  }));
}

export function totalMinutes(items: PathwayItem[], units: MicroUnit[]): number {
  return items.reduce(
    (s, it) => s + (units.find((u) => u.id === it.unitId)?.durationMinutes ?? 0),
    0,
  );
}

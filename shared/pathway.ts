import type { MicroUnit } from './types';

// Rules-based pathway (SPEC 7.5, TECH_SPEC pathway fallback). Pure, so it runs the same
// in the browser and in tests. The time budget and teaching-day rules are enforced here.

export interface PathwayNeed {
  id: string;
  topic: string;
  evidence: string;
  priority: 'now' | 'soon' | 'later';
  catalogue_tags: string[];
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
  /** 1 = Monday to 5 = Friday. */
  teachingDays: number[];
  /** Monday of the week, YYYY-MM-DD. */
  weekStart: string;
}

const PRIORITY_RANK = { now: 0, soon: 1, later: 2 } as const;

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

export function buildPathway(input: PathwayInput): PathwayItem[] {
  const budget = Math.round(input.hoursPerWeek * 60);
  const needs = [...input.needs].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );

  // Units per need, easiest first. A unit is used once, for the most urgent need it matches.
  const used = new Set<string>();
  const queues = needs.map((need) => ({
    need,
    units: input.units
      .filter((u) => u.tags.some((t) => need.catalogue_tags.includes(t)))
      .sort((a, b) => {
        const primary = (u: MicroUnit) => (need.catalogue_tags.includes(u.tags[0] ?? '') ? 0 : 1);
        return primary(a) - primary(b) || a.difficulty - b.difficulty || a.id.localeCompare(b.id);
      }),
  }));

  // Take units need by need within each priority band, but give every "now" need its first
  // unit before any need gets a second, so the week isn't all one topic.
  const picked: { unit: MicroUnit; need: PathwayNeed }[] = [];
  let minutes = 0;
  for (const band of ['now', 'soon', 'later'] as const) {
    const bandQueues = queues.filter((q) => q.need.priority === band);
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
        picked.push({ unit: u, need: q.need });
      }
    }
  }

  // Learning goes on non-teaching weekdays; if there are none, on teaching days.
  const free = [1, 2, 3, 4, 5].filter((d) => !input.teachingDays.includes(d));
  const days = free.length ? free : [1, 2, 3, 4, 5];
  const perDay = Math.ceil(picked.length / days.length);
  return picked.map(({ unit, need }, i) => ({
    unitId: unit.id,
    needId: need.id,
    reason: reasonFor(need),
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

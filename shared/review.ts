// In-app content review (replaces the Word review document, 27 Nov 2026). Pure functions only,
// so they can be unit tested: the list of reviewable items, which fields a reviewer may edit,
// applying edits on top of the files in content/, and the hash that ties an approval to the
// exact content that was approved.
import { BASE_MISCONCEPTIONS, BASE_UNITS } from './catalogue';
import { BASE_DIAGNOSTICS } from './diagnostics';
import { TAGS, tagById, DOMAIN_LABELS } from './tags';
import type { CheckQuestion, MicroUnit } from './types';

export type ReviewKind = 'unit' | 'misconception' | 'diagnostic' | 'topic';
export type ReviewStatus = 'draft' | 'approved' | 'flagged';
export type ReviewEdits = Record<string, string | string[]>;

export const KIND_LABELS: Record<ReviewKind, { one: string; many: string }> = {
  unit: { one: 'Learning unit', many: 'Learning units' },
  misconception: { one: 'Misconception', many: 'Misconceptions' },
  diagnostic: { one: 'Check question', many: 'Check questions' },
  topic: { one: 'Lesson topic codes', many: 'Lesson topic codes' },
};
export const REVIEW_KINDS = Object.keys(KIND_LABELS) as ReviewKind[];

/** One row of content_reviews (supabase/migrations/0005_content_review.sql). */
export interface ReviewRow {
  item_kind: ReviewKind;
  item_id: string;
  status: ReviewStatus;
  edits: ReviewEdits;
  approved_hash: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  version: number;
  updated_at: string;
}

export interface ReviewItem {
  kind: ReviewKind;
  id: string;
  title: string;
  /** "Content knowledge", or the topic for misconceptions and check questions. */
  area: string;
  yearLevels: string[];
  /** Senior topics belong to some states only. Null means every state. */
  states: string[] | null;
  /** The content as it is in the repo, before any edits. */
  base: object;
}

export interface EditableField {
  path: string;
  label: string;
  /** md: Markdown with maths; lines: one entry per line (answer options). */
  type: 'text' | 'md' | 'lines';
}

const topicYears = (tag: string) => tagById(tag)?.yearLevels ?? [];
const topicStates = (tag: string) => tagById(tag)?.states ?? null;
const topicLabel = (tag: string) => tagById(tag)?.label ?? tag;

/** Every item a reviewer can approve, in a stable order. */
export function reviewItems(): ReviewItem[] {
  return [
    ...BASE_UNITS.map((u) => ({
      kind: 'unit' as const,
      id: u.id,
      title: u.title,
      area: DOMAIN_LABELS[u.domain],
      yearLevels: u.yearLevels,
      states: null,
      base: u,
    })),
    ...BASE_MISCONCEPTIONS.map((m) => ({
      kind: 'misconception' as const,
      id: m.id,
      title: m.studentSays,
      area: topicLabel(m.topicTag),
      yearLevels: topicYears(m.topicTag),
      states: topicStates(m.topicTag),
      base: m,
    })),
    ...BASE_DIAGNOSTICS.map((d) => ({
      kind: 'diagnostic' as const,
      id: d.id,
      title: d.stemMd,
      area: topicLabel(d.topicTag),
      yearLevels: topicYears(d.topicTag),
      states: topicStates(d.topicTag),
      base: d,
    })),
    ...TAGS.filter((t) => 'curriculum' in t).map((t) => ({
      kind: 'topic' as const,
      id: t.id,
      title: t.label,
      area: DOMAIN_LABELS[t.domain],
      yearLevels: t.yearLevels,
      states: t.states ?? null,
      base: t,
    })),
  ];
}

const questionFields = (prefix: string, q: CheckQuestion, label: string): EditableField[] => [
  { path: `${prefix}stemMd`, label: `${label}: question`, type: 'md' },
  ...(q.type === 'mcq'
    ? [
        {
          path: `${prefix}options`,
          label: `${label}: options (one per line)`,
          type: 'lines' as const,
        },
      ]
    : []),
  { path: `${prefix}answer`, label: `${label}: answer`, type: 'text' },
  { path: `${prefix}feedbackCorrect`, label: `${label}: feedback when right`, type: 'md' },
  { path: `${prefix}feedbackIncorrect`, label: `${label}: feedback when wrong`, type: 'md' },
  ...(q.workedSolutionMd !== undefined
    ? [
        {
          path: `${prefix}workedSolutionMd`,
          label: `${label}: worked solution`,
          type: 'md' as const,
        },
      ]
    : []),
];

/** The fields a reviewer can edit for an item. Curriculum codes are never free text. */
export function editableFields(item: ReviewItem): EditableField[] {
  if (item.kind === 'unit') {
    const u = item.base as MicroUnit;
    return [
      { path: 'title', label: 'Title', type: 'text' },
      { path: 'hook', label: 'Hook', type: 'md' },
      { path: 'coreIdeaMd', label: 'Core idea', type: 'md' },
      ...(u.workedExampleMd !== undefined
        ? [{ path: 'workedExampleMd', label: 'Worked example', type: 'md' as const }]
        : []),
      ...u.checkItems.flatMap((q, i) =>
        questionFields(`checkItems.${i}.`, q, `Quick check ${i + 1}`),
      ),
      { path: 'tryTomorrow', label: 'Try tomorrow', type: 'md' },
      { path: 'reflectPrompt', label: 'Reflect prompt', type: 'md' },
    ];
  }
  if (item.kind === 'misconception')
    return [
      { path: 'studentSays', label: 'Student says', type: 'text' },
      { path: 'whyItHappens', label: 'Why it happens', type: 'md' },
      { path: 'howToRespond', label: 'How to respond', type: 'md' },
      { path: 'diagnosticQuestion', label: 'Diagnostic question', type: 'md' },
    ];
  if (item.kind === 'diagnostic') return questionFields('', item.base as CheckQuestion, 'Question');
  return [];
}

export function getPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      obj,
    );
}

/** A copy of obj with one value replaced. Only existing paths are set, so edits can't add keys. */
function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  if (!head || !obj || typeof obj !== 'object' || !(head in obj)) return obj;
  const copy = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string, unknown>;
  copy[head] = rest.length ? setPath(copy[head], rest.join('.'), value) : value;
  return copy as T;
}

/** The content with a reviewer's edits on top. Edits to fields that no longer exist are ignored. */
export function applyEdits<T extends object>(base: T, edits: ReviewEdits | null | undefined): T {
  let out = base;
  for (const [path, value] of Object.entries(edits ?? {})) {
    const current = getPath(base, path);
    const sameType = Array.isArray(current) ? Array.isArray(value) : typeof current === 'string';
    if (current !== undefined && sameType) out = setPath(out, path, value);
  }
  return out;
}

/** Only the fields that differ from the file, so saved edits stay small and readable. */
export function diffEdits(base: object, values: ReviewEdits): ReviewEdits {
  const out: ReviewEdits = {};
  for (const [path, value] of Object.entries(values)) {
    if (JSON.stringify(getPath(base, path)) !== JSON.stringify(value)) out[path] = value;
  }
  return out;
}

/** Problems that would break the quick check, shown before an edit is saved. */
export function editProblems(item: ReviewItem, values: ReviewEdits): string[] {
  const merged = applyEdits(item.base, values) as Record<string, unknown>;
  const questions: { q: CheckQuestion; label: string }[] =
    item.kind === 'unit'
      ? ((merged.checkItems as CheckQuestion[]) ?? []).map((q, i) => ({
          q,
          label: `Quick check ${i + 1}`,
        }))
      : item.kind === 'diagnostic'
        ? [{ q: merged as unknown as CheckQuestion, label: 'The question' }]
        : [];
  const problems: string[] = [];
  for (const { q, label } of questions) {
    if (!q.answer?.trim()) problems.push(`${label} needs an answer.`);
    if (q.type === 'mcq' && !(q.options ?? []).some((o) => o.trim() === q.answer.trim()))
      problems.push(`${label}: the answer must match one of the options exactly.`);
    if (q.type === 'numeric' && !Number.isFinite(Number(q.answer.replace(/[$,\s]/g, ''))))
      problems.push(`${label}: the answer must be a number.`);
  }
  if (
    item.kind !== 'topic' &&
    editableFields(item).some((f) => {
      const v = getPath(merged, f.path);
      return f.path === 'title' && typeof v === 'string' && !v.trim();
    })
  )
    problems.push('The title cannot be empty.');
  return problems;
}

const REVIEW_KEYS = new Set(['reviewedBy', 'reviewedOn', 'reviewedHash']);

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .filter((k) => !REVIEW_KEYS.has(k))
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

/** Short hash of the content (review fields left out). Same in the browser and in Node. */
export function contentHash(content: unknown): string {
  const s = stable(content);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export type EffectiveStatus = ReviewStatus | 'changed';

/**
 * Where an item stands. An approval only counts while the content still matches what was
 * approved: if the file in the repo changes afterwards, the item is "changed" (Draft again).
 */
export function effectiveStatus(item: ReviewItem, row: ReviewRow | undefined): EffectiveStatus {
  if (!row) return 'draft';
  if (row.status !== 'approved') return row.status;
  return row.approved_hash === contentHash(applyEdits(item.base, row.edits))
    ? 'approved'
    : 'changed';
}

export const STATUS_LABELS: Record<EffectiveStatus, string> = {
  draft: 'To review',
  flagged: 'Flagged',
  approved: 'Approved',
  changed: 'Changed since approval',
};

export interface ReviewFilter {
  kinds: ReviewKind[];
  years: string[];
  state: string | null;
  status: 'todo' | 'flagged' | 'approved' | 'all';
  search?: string;
}

/** Items with no year list (teaching practice) fit every year. */
export function matchesFilter(item: ReviewItem, status: EffectiveStatus, f: ReviewFilter): boolean {
  if (f.kinds.length && !f.kinds.includes(item.kind)) return false;
  if (f.years.length && item.yearLevels.length && !item.yearLevels.some((y) => f.years.includes(y)))
    return false;
  if (f.state && item.states && !item.states.includes(f.state)) return false;
  if (f.status === 'todo' && status !== 'draft' && status !== 'changed') return false;
  if (f.status === 'flagged' && status !== 'flagged') return false;
  if (f.status === 'approved' && status !== 'approved') return false;
  const q = f.search?.trim().toLowerCase();
  if (q && !`${item.title} ${item.id} ${item.area}`.toLowerCase().includes(q)) return false;
  return true;
}

export interface Progress {
  total: number;
  approved: number;
  flagged: number;
  todo: number;
}

export function progressOf(statuses: EffectiveStatus[]): Progress {
  const approved = statuses.filter((s) => s === 'approved').length;
  const flagged = statuses.filter((s) => s === 'flagged').length;
  return { total: statuses.length, approved, flagged, todo: statuses.length - approved - flagged };
}

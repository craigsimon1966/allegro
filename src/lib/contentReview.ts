import { create } from 'zustand';
import { BASE_MISCONCEPTIONS, BASE_UNITS, MISCONCEPTIONS, UNITS } from '@shared/catalogue';
import { BASE_DIAGNOSTICS, DIAGNOSTICS } from '@shared/diagnostics';
import {
  applyEdits,
  contentHash,
  type ReviewEdits,
  type ReviewKind,
  type ReviewRow,
} from '@shared/review';
import { supabase } from './supabase';

// In-app content review, browser side. Everyone (demo and signed-in) loads content_reviews so
// reviewer edits show and approved items drop the Draft label. Reviewers also act on items.

const CACHE_KEY = 'allegro-content-reviews';

interface ReviewState {
  rows: ReviewRow[];
  /** Bumped each time the overlay is applied, so screens re-read the catalogue. */
  version: number;
  loaded: boolean;
}

export const useReviewStore = create<ReviewState>(() => ({ rows: [], version: 0, loaded: false }));
export const useContentVersion = () => useReviewStore((s) => s.version);

const rowKey = (kind: string, id: string) => `${kind}:${id}`;

/**
 * Puts reviewer edits and approvals into the catalogue arrays the whole app reads. A unit,
 * misconception or check question gets reviewedBy only while the approval matches its content.
 */
export function applyReviewOverlay(rows: ReviewRow[]): void {
  const byKey = new Map(rows.map((r) => [rowKey(r.item_kind, r.item_id), r]));
  const overlay = <T extends { id: string }>(kind: ReviewKind, base: readonly T[], live: T[]) => {
    base.forEach((b, i) => {
      const row = byKey.get(rowKey(kind, b.id));
      if (!row) {
        live[i] = b;
        return;
      }
      const edited = applyEdits(b, row.edits);
      const approved =
        row.status === 'approved' && row.approved_hash === contentHash(edited) ? row : null;
      live[i] =
        'reviewedBy' in b
          ? {
              ...edited,
              reviewedBy: approved ? approved.reviewed_by_name : null,
              reviewedOn: approved?.reviewed_at?.slice(0, 10),
            }
          : edited;
    });
  };
  overlay('unit', BASE_UNITS, UNITS);
  overlay('misconception', BASE_MISCONCEPTIONS, MISCONCEPTIONS);
  overlay('diagnostic', BASE_DIAGNOSTICS, DIAGNOSTICS);
  useReviewStore.setState((s) => ({ rows, version: s.version + 1, loaded: true }));
}

/** On start: last known reviews straight away (no flash of Draft labels), then fresh ones. */
export async function loadContentReviews(): Promise<void> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) applyReviewOverlay(JSON.parse(cached) as ReviewRow[]);
  } catch {
    // No storage (private window): load from the server only.
  }
  await refreshContentReviews();
}

export async function refreshContentReviews(): Promise<ReviewRow[]> {
  if (!supabase) return useReviewStore.getState().rows;
  const { data, error } = await supabase
    .from('content_reviews')
    .select(
      'item_kind, item_id, status, edits, approved_hash, reviewed_by_name, reviewed_at, version, updated_at',
    );
  if (error || !data) return useReviewStore.getState().rows;
  const rows = data as ReviewRow[];
  applyReviewOverlay(rows);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    // Storage full or blocked: fine, the next load fetches again.
  }
  return rows;
}

export interface ReviewRole {
  isAdmin: boolean;
  isReviewer: boolean;
}

/** Null when not signed in. RLS and the database functions are the real guard. */
export async function loadReviewRole(): Promise<ReviewRole | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const [{ data: reviewer }, { data: profile }] = await Promise.all([
    supabase.rpc('is_reviewer'),
    supabase.from('profiles').select('is_admin').eq('user_id', auth.user.id).maybeSingle(),
  ]);
  return { isAdmin: Boolean(profile?.is_admin), isReviewer: reviewer === true };
}

export type ReviewAction = 'approve' | 'flag' | 'edit' | 'comment' | 'reopen';

const MESSAGES: Record<string, string> = {
  stale:
    'Someone else has just reviewed this item. Your screen has been refreshed: please check it and try again.',
  comment_required: 'Please write a comment first.',
  no_change: 'Nothing has changed, so there is nothing to save.',
  not_reviewer: 'Your account is not set up as a reviewer.',
};

export class ReviewError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function reviewItem(args: {
  kind: ReviewKind;
  id: string;
  action: ReviewAction;
  version: number;
  comment?: string;
  edits?: ReviewEdits;
  hash?: string;
}): Promise<ReviewRow> {
  if (!supabase) throw new ReviewError('offline', 'Reviewing needs the live site.');
  const { data, error } = await supabase.rpc('review_item', {
    p_kind: args.kind,
    p_id: args.id,
    p_action: args.action,
    p_version: args.version,
    p_comment: args.comment ?? null,
    p_edits: args.edits ?? null,
    p_hash: args.hash ?? null,
  });
  if (error) {
    const code = Object.keys(MESSAGES).find((k) => error.message.includes(k)) ?? 'server_error';
    if (code === 'stale') await refreshContentReviews();
    throw new ReviewError(
      code,
      MESSAGES[code] ?? "We couldn't save that. Check your connection and try again.",
    );
  }
  await refreshContentReviews();
  return data as ReviewRow;
}

export interface ReviewEvent {
  id: number;
  item_kind: ReviewKind;
  item_id: string;
  action: 'approved' | 'flagged' | 'edited' | 'commented' | 'reopened';
  comment: string | null;
  before_edits: ReviewEdits | null;
  after_edits: ReviewEdits | null;
  actor_name: string;
  created_at: string;
}

const EVENT_COLUMNS =
  'id, item_kind, item_id, action, comment, before_edits, after_edits, actor_name, created_at';

export async function loadItemEvents(kind: ReviewKind, id: string): Promise<ReviewEvent[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('content_review_events')
    .select(EVENT_COLUMNS)
    .eq('item_kind', kind)
    .eq('item_id', id)
    .order('created_at', { ascending: false });
  return (data ?? []) as ReviewEvent[];
}

/** Latest activity across all items, for the queue. */
export async function loadRecentEvents(limit = 20): Promise<ReviewEvent[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('content_review_events')
    .select(EVENT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as ReviewEvent[];
}

export interface PilotYears {
  years: { value: string; teachers: number }[];
  states: { value: string; teachers: number }[];
}

export async function loadPilotYears(): Promise<PilotYears> {
  const empty = { years: [], states: [] };
  if (!supabase) return empty;
  const { data } = await supabase.rpc('pilot_years');
  const rows = (data ?? []) as { kind: string; value: string; teachers: number }[];
  return {
    years: rows.filter((r) => r.kind === 'year'),
    states: rows.filter((r) => r.kind === 'state'),
  };
}

export interface Reviewer {
  email: string;
  display_name: string;
  granted_at: string;
}

export async function loadReviewers(): Promise<Reviewer[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('reviewers')
    .select('email, display_name, granted_at')
    .order('granted_at');
  return (data ?? []) as Reviewer[];
}

export async function grantReviewer(email: string, name: string): Promise<void> {
  if (!supabase) throw new ReviewError('offline', 'This needs the live site.');
  const { error } = await supabase.rpc('grant_reviewer', { p_email: email, p_name: name });
  if (error)
    throw new ReviewError(
      'server_error',
      error.message.includes('bad_email')
        ? 'That email address does not look right.'
        : error.message.includes('name_required')
          ? 'Please add the reviewer’s name.'
          : "We couldn't add that reviewer. Please try again.",
    );
}

export async function revokeReviewer(email: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('revoke_reviewer', { p_email: email });
  if (error) throw new ReviewError('server_error', "We couldn't remove that reviewer.");
}

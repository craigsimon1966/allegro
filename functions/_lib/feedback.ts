import { z } from 'zod';
import { findLikelyStudentNames } from '../../shared/pii';
import type { Env } from './env';
import { error } from './respond';

// POST /api/feedback (SPEC 14). Anonymous by design: a random session id, never a user id.
// Inserted with the public key; RLS allows insert only, and only admins can read.

export const FeedbackSchema = z
  .object({
    sessionId: z.string().min(8).max(64),
    target: z.string().regex(/^(diagnosis|pathway|lesson|help|survey|error|unit:[a-z0-9-]{1,80})$/),
    thumbs: z.union([z.literal(1), z.literal(-1)]).optional(),
    scores: z.record(z.string().max(4), z.number().int().min(1).max(5)).optional(),
    comment: z.string().max(2000).optional(),
  })
  .refine((f) => f.thumbs !== undefined || f.scores || f.comment, 'Empty feedback')
  .refine((f) => f.target !== 'error' || (f.comment && !f.thumbs && !f.scores), 'Bad error report');

export async function handleFeedback(
  request: Request,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('invalid_input', 'We could not read that feedback.');
  }
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) return error('invalid_input', 'We could not read that feedback.');
  const f = parsed.data;
  // Error reports are machine text; the name check would only cause false alarms.
  if (f.target !== 'error' && f.comment && findLikelyStudentNames(f.comment).length)
    return error(
      'invalid_input',
      "It looks like this includes a student's name. Please remove it and try again.",
      { reason: 'student_pii' },
    );
  // Without Supabase (local dev, tests) feedback is accepted and dropped.
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return new Response(null, { status: 204 });
  const res = await fetchImpl(`${env.SUPABASE_URL}/rest/v1/feedback`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      session_id: f.sessionId,
      target: f.target,
      thumbs: f.thumbs ?? null,
      scores: f.scores ?? null,
      comment: f.comment?.trim() || null,
    }),
  });
  if (!res.ok) return error('server_error', 'We could not save that feedback. Please try again.');
  return new Response(null, { status: 204 });
}

import { hasAccess } from '../_lib/access';
import { handleAccess } from '../_lib/accessHandler';
import type { Env } from '../_lib/env';
import { error } from '../_lib/respond';

// POST /api/access checks the code and sets the cookie (TECH_SPEC 6.2).
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleAccess(request, env);

// GET /api/access tells the app whether this browser already has access.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) =>
  (await hasAccess(request, env))
    ? new Response(null, { status: 204 })
    : error('unauthorised', 'Access code needed.');

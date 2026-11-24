import { json } from '../_lib/respond';

// GET /api/health (TECH_SPEC 7.2). AI call count for the last 24 hours is added in M1,
// once ai_calls logging exists.
const VERSION = '0.0.0';
const CONTENT_VERSION = '0';

export const onRequestGet: PagesFunction = async () =>
  json({ ok: true, version: VERSION, contentVersion: CONTENT_VERSION });

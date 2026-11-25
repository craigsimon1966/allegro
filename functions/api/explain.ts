import { handleExplain } from '../_lib/explain';
import type { Env } from '../_lib/env';

// POST /api/explain (SPEC 7.6, TECH_SPEC 7.2)
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleExplain(request, env);

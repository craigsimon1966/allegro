import { handleHelp } from '../_lib/help';
import type { Env } from '../_lib/env';

// POST /api/help (TECH_SPEC 7.2)
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleHelp(request, env);

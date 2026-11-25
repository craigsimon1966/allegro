import { handleReflect } from '../_lib/help';
import type { Env } from '../_lib/env';

// POST /api/reflect (TECH_SPEC 7.2)
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleReflect(request, env);

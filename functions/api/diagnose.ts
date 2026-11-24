import { handleDiagnose } from '../_lib/diagnose';
import type { Env } from '../_lib/env';

// POST /api/diagnose (SPEC 8.2, TECH_SPEC 7.2)
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleDiagnose(request, env);

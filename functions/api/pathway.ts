import { handlePathway } from '../_lib/pathway';
import type { Env } from '../_lib/env';

// POST /api/pathway (TECH_SPEC 7.2)
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handlePathway(request, env);

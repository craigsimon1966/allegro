import { handleLesson } from '../_lib/lesson';
import type { Env } from '../_lib/env';

// POST /api/lesson (SPEC 7.7, TECH_SPEC 7.2)
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleLesson(request, env);

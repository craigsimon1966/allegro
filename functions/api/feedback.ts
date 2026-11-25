import { handleFeedback } from '../_lib/feedback';
import type { Env } from '../_lib/env';

// POST /api/feedback (SPEC 8.2, 14)
export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleFeedback(request, env);

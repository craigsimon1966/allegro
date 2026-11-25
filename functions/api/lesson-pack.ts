import { handleLessonPack } from '../_lib/lesson';
import type { Env } from '../_lib/env';

// POST /api/lesson-pack: worksheets, teacher steps and smart board slides for a lesson.
export const onRequestPost: PagesFunction<Env> = ({ request, env }) =>
  handleLessonPack(request, env);

import { handleAccountDelete } from '../../_lib/account';
import type { Env } from '../../_lib/env';

// POST /api/account/delete (TECH_SPEC 5.3, 7.2)
export const onRequestPost: PagesFunction<Env> = ({ request, env }) =>
  handleAccountDelete(request, env);

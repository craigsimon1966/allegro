import { handleHealth, type HealthEnv } from '../_lib/health';

// GET /api/health (TECH_SPEC 7.2)
export const onRequestGet: PagesFunction<HealthEnv> = ({ env }) => handleHealth(env);

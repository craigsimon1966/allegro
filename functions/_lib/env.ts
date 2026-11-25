// Runtime environment for Pages Functions (TECH_SPEC 8). Optional values let local dev and
// tests run without accounts; endpoints degrade gracefully when a value is missing.
export interface Env {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_MODEL_FAST?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DEMO_ACCESS_CODE?: string;
  ACCESS_COOKIE_SECRET?: string;
  RATE_LIMIT_USER_PER_HOUR?: string;
  RATE_LIMIT_DEMO_PER_HOUR?: string;
  DEBUG_PROMPTS?: string;
}

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
export const DEFAULT_MODEL_FAST = 'claude-haiku-5-5';

export const mainModel = (env: Env) => env.ANTHROPIC_MODEL || DEFAULT_MODEL;
export const fastModel = (env: Env) => env.ANTHROPIC_MODEL_FAST || DEFAULT_MODEL_FAST;

/** Max output tokens per endpoint, in one place (SPEC 8.7, TECH_SPEC 7.2). */
export const MAX_TOKENS = {
  // Real replies for a full situation run to about 1,500 tokens, so 1,500 cut the JSON off.
  diagnose: 4000,
  pathway: 1200,
  explain: 400,
  lesson: 3500,
  'lesson-block': 1000,
  help: 350,
  reflect: 300,
} as const;

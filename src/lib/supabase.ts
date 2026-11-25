import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser Supabase client (TECH_SPEC 6). Null until VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY are set, so demo mode works with no account.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, { auth: { flowType: 'pkce', persistSession: true } })
    : null;

export const supabaseConfigured = supabase !== null;

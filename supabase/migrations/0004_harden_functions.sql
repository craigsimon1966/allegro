-- Fixes two Supabase security advisor warnings after 0001 (applied 25 Nov 2026).
-- touch_updated_at gets a fixed search_path; handle_new_user is only for the auth trigger,
-- so nobody should be able to call it through /rest/v1/rpc.
alter function public.touch_updated_at() set search_path = public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

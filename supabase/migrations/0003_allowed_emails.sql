-- Pilot allow-list (TECH_SPEC 6.3; default for decision 1 in TECH_SPEC 15 is "yes").
-- Only addresses in this table can create an account. Craig adds pilot teachers by hand
-- in the Supabase table editor. Remove this hook to open sign-up.

create table public.allowed_emails (
  email text primary key check (email = lower(email)),
  note text,
  created_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;
-- No policies: the browser can never read or write this table. The hook below reads it
-- as supabase_auth_admin.

grant select on public.allowed_emails to supabase_auth_admin;

-- "Before user created" auth hook. After applying this migration, turn it on in the
-- Supabase dashboard: Authentication, Hooks, Before User Created, Postgres function
-- public.hook_allowed_email.
create or replace function public.hook_allowed_email(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  addr text := lower(coalesce(event -> 'user' ->> 'email', ''));
begin
  if exists (select 1 from public.allowed_emails where email = addr) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'This email is not on the Allegro pilot list. Please contact the Allegro team.'
    )
  );
end $$;

grant execute on function public.hook_allowed_email(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_allowed_email(jsonb) from authenticated, anon, public;

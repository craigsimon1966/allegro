-- Copied exactly from TECH_SPEC.md section 5.1. Apply with `supabase db push`.

-- Profiles: one row per signed-in teacher
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text check (role in ('out_of_field','early_career','casual','experienced','leader')),
  subject text,
  year_levels text[] default '{}',
  school_type text check (school_type in ('government','catholic','independent','unknown')) default 'unknown',
  location_type text check (location_type in ('metro','regional','rural','remote','unknown')) default 'unknown',
  hours_per_week numeric(3,1),
  teaching_days smallint[] default '{}',          -- 1 = Monday ... 5 = Friday
  is_admin boolean not null default false,       -- set by hand in Supabase for Craig only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each time a teacher describes their situation
create table public.intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  situation_text text not null check (char_length(situation_text) <= 4000),
  diagnosis jsonb not null,                      -- validated DiagnosisSchema output
  created_at timestamptz not null default now()
);

create table public.needs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  intake_id uuid references public.intakes(id) on delete set null,
  domain text not null check (domain in ('CK','PK','PCK','ASSESSMENT','WELLBEING','CONTEXT')),
  topic text not null,
  tags text[] not null default '{}',
  evidence text,
  priority text not null check (priority in ('now','soon','later')),
  self_rating smallint check (self_rating between 1 and 5),
  diagnostic_result text check (diagnostic_result in ('solid','refresh','start_here')),
  status text not null default 'active' check (status in ('active','removed','met')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pathway_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unit_id text not null,                         -- id from content/units
  need_id uuid references public.needs(id) on delete set null,
  reason text,
  scheduled_for date,
  sort_order int not null default 0,
  status text not null default 'todo' check (status in ('todo','in_progress','done','skipped')),
  created_at timestamptz not null default now()
);

create table public.unit_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  unit_id text not null,
  started_at timestamptz,
  completed_at timestamptz,
  check_answers jsonb default '{}',
  reflect_note text check (char_length(reflect_note) <= 1000),
  primary key (user_id, unit_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  topic_tag text,
  year_level text,
  duration_minutes int,
  inputs jsonb not null,                          -- what the teacher asked for
  plan jsonb not null,                            -- validated LessonSchema
  maths_checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  tried text, happened text, next_time text,
  ai_observation text,
  suggested_unit_id text,
  created_at timestamptz not null default now()
);

create table public.confidence_ratings (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  need_id uuid not null references public.needs(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

-- Pilot feedback: anonymous by design (no user_id)
create table public.feedback (
  id bigint generated always as identity primary key,
  session_id text not null,                       -- random per browser session
  target text not null,                           -- 'diagnosis' | 'pathway' | 'unit:<id>' | 'lesson' | 'help' | 'survey'
  thumbs smallint check (thumbs in (-1, 1)),
  scores jsonb,                                   -- survey answers 1-5
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

-- Usage log for rate limiting and cost tracking (no prompt text stored)
create table public.ai_calls (
  id bigint generated always as identity primary key,
  subject text not null,                          -- user id or 'demo:<session>'
  endpoint text not null,
  model text not null,
  input_tokens int, output_tokens int,
  ok boolean not null,
  created_at timestamptz not null default now()
);
create index on public.ai_calls (subject, created_at desc);

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_needs    before update on public.needs    for each row execute function public.touch_updated_at();
create trigger t_lessons  before update on public.lessons  for each row execute function public.touch_updated_at();

-- Create a profile on sign-up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (user_id) values (new.id) on conflict do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

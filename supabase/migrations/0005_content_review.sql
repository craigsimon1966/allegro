-- In-app content review (replaces the Word review document, 27 Nov 2026).
-- Reviewers approve, edit or flag each Draft content item (units, misconceptions, diagnostic
-- check questions and the curriculum codes on lesson topics). The admin grants the reviewer
-- role by email. Every action is logged, so the app can show who did what and when, and edits
-- keep a full before/after history.
--
-- Writes only go through the security definer functions below, which check the caller's role.
-- The browser can read content_reviews (so approved items drop the Draft label for everyone),
-- but only reviewers can read the reviewer list and the history.

-- Reviewers, by email so the admin can grant the role before the person has signed in.
create table public.reviewers (
  email text primary key check (email = lower(email)),
  display_name text not null check (char_length(display_name) between 1 and 80),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now()
);
alter table public.reviewers enable row level security;

create or replace function public.current_email()
returns text
language sql
stable
set search_path = public
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.profiles where user_id = auth.uid() and is_admin) $$;

create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    public.is_admin()
    or exists (select 1 from public.reviewers where email = public.current_email())
  )
$$;

create policy "reviewers read" on public.reviewers for select
  using (public.is_reviewer());

-- The current state of each item. One row per item once anyone has acted on it.
create table public.content_reviews (
  item_kind text not null check (item_kind in ('unit','misconception','diagnostic','topic')),
  item_id text not null check (char_length(item_id) <= 120),
  status text not null default 'draft' check (status in ('draft','approved','flagged')),
  -- Field edits on top of the file in the repo: {"hook": "...", "checkItems.0.stemMd": "..."}.
  edits jsonb not null default '{}'::jsonb,
  -- Hash of the content as approved (shared/review.ts contentHash). If the file in the repo
  -- changes after approval, the hash no longer matches and the item shows as Draft again.
  approved_hash text,
  reviewed_by_name text,
  reviewed_at timestamptz,
  version int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (item_kind, item_id)
);
alter table public.content_reviews enable row level security;
create policy "content reviews public read" on public.content_reviews for select using (true);
grant select on public.content_reviews to anon, authenticated;

-- Everything anyone did, newest last. Never updated or deleted.
create table public.content_review_events (
  id bigint generated always as identity primary key,
  item_kind text not null,
  item_id text not null,
  action text not null check (action in ('approved','flagged','edited','commented','reopened')),
  comment text check (char_length(comment) <= 4000),
  before_edits jsonb,
  after_edits jsonb,
  actor uuid references auth.users(id) on delete set null,
  actor_name text not null,
  created_at timestamptz not null default now()
);
create index content_review_events_item on public.content_review_events (item_kind, item_id, created_at);
alter table public.content_review_events enable row level security;
create policy "review events reviewer read" on public.content_review_events for select
  using (public.is_reviewer());

-- The name shown against a reviewer's actions.
create or replace function public.reviewer_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select display_name from public.reviewers where email = public.current_email()),
    nullif((select display_name from public.profiles where user_id = auth.uid()), ''),
    split_part(public.current_email(), '@', 1)
  )
$$;

-- One review action. p_version is the version the reviewer was looking at; if someone else
-- has acted since, the call fails with 'stale' so nobody overwrites another reviewer's work.
create or replace function public.review_item(
  p_kind text,
  p_id text,
  p_action text,
  p_version int,
  p_comment text default null,
  p_edits jsonb default null,
  p_hash text default null
)
returns public.content_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  cur public.content_reviews;
  who text := public.reviewer_name();
  note text := nullif(btrim(coalesce(p_comment, '')), '');
  prev jsonb;
begin
  if not public.is_reviewer() then
    raise exception 'not_reviewer' using errcode = '42501';
  end if;
  if p_action not in ('approve','flag','edit','comment','reopen') then
    raise exception 'bad_action';
  end if;

  insert into public.content_reviews (item_kind, item_id) values (p_kind, p_id)
    on conflict do nothing;
  select * into cur from public.content_reviews
    where item_kind = p_kind and item_id = p_id for update;
  if cur.version <> p_version then
    raise exception 'stale';
  end if;

  if p_action = 'approve' then
    if p_hash is null then raise exception 'hash_required'; end if;
    update public.content_reviews set status = 'approved', approved_hash = p_hash,
      reviewed_by_name = who, reviewed_at = now(), version = version + 1, updated_at = now()
      where item_kind = p_kind and item_id = p_id returning * into cur;
    insert into public.content_review_events (item_kind, item_id, action, comment, actor, actor_name)
      values (p_kind, p_id, 'approved', note, auth.uid(), who);

  elsif p_action = 'flag' then
    if note is null then raise exception 'comment_required'; end if;
    update public.content_reviews set status = 'flagged', approved_hash = null,
      reviewed_by_name = who, reviewed_at = now(), version = version + 1, updated_at = now()
      where item_kind = p_kind and item_id = p_id returning * into cur;
    insert into public.content_review_events (item_kind, item_id, action, comment, actor, actor_name)
      values (p_kind, p_id, 'flagged', note, auth.uid(), who);

  elsif p_action = 'edit' then
    if p_edits is null or jsonb_typeof(p_edits) <> 'object' then raise exception 'edits_required'; end if;
    if p_edits = cur.edits then raise exception 'no_change'; end if;
    prev := cur.edits;
    -- An edit to approved content needs approving again.
    update public.content_reviews set edits = p_edits,
      status = case when status = 'approved' then 'draft' else status end,
      approved_hash = case when status = 'approved' then null else approved_hash end,
      version = version + 1, updated_at = now()
      where item_kind = p_kind and item_id = p_id returning * into cur;
    insert into public.content_review_events
      (item_kind, item_id, action, comment, before_edits, after_edits, actor, actor_name)
      values (p_kind, p_id, 'edited', note,
        prev, p_edits, auth.uid(), who);

  elsif p_action = 'comment' then
    if note is null then raise exception 'comment_required'; end if;
    update public.content_reviews set version = version + 1, updated_at = now()
      where item_kind = p_kind and item_id = p_id returning * into cur;
    insert into public.content_review_events (item_kind, item_id, action, comment, actor, actor_name)
      values (p_kind, p_id, 'commented', note, auth.uid(), who);

  else -- reopen
    update public.content_reviews set status = 'draft', approved_hash = null,
      version = version + 1, updated_at = now()
      where item_kind = p_kind and item_id = p_id returning * into cur;
    insert into public.content_review_events (item_kind, item_id, action, comment, actor, actor_name)
      values (p_kind, p_id, 'reopened', note, auth.uid(), who);
  end if;

  return cur;
end $$;

-- Admin only: give someone the reviewer role. Also adds them to the pilot list so they can sign in.
create or replace function public.grant_reviewer(p_email text, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  addr text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  if addr !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad_email'; end if;
  if nullif(btrim(coalesce(p_name, '')), '') is null then raise exception 'name_required'; end if;
  insert into public.reviewers (email, display_name, granted_by)
    values (addr, btrim(p_name), auth.uid())
    on conflict (email) do update set display_name = excluded.display_name;
  insert into public.allowed_emails (email, note) values (addr, 'Content reviewer')
    on conflict (email) do nothing;
end $$;

-- Admin only: take the reviewer role away. Their past actions stay in the history.
create or replace function public.revoke_reviewer(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  delete from public.reviewers where email = lower(btrim(p_email));
end $$;

-- Reviewers only: which year levels and states the pilot teachers chose, as counts only, so
-- the queue can suggest where to start. Reviewers and the admin are left out.
create or replace function public.pilot_years()
returns table (kind text, value text, teachers bigint)
language sql
stable
security definer
set search_path = public
as $$
  with latest as (
    select distinct on (i.user_id) i.user_id, i.diagnosis -> 'teacher_answers' as a
    from public.intakes i
    join auth.users u on u.id = i.user_id
    where not exists (select 1 from public.profiles p where p.user_id = i.user_id and p.is_admin)
      and not exists (select 1 from public.reviewers r where r.email = lower(u.email))
    order by i.user_id, i.created_at desc
  )
  select 'year', y, count(distinct user_id) from latest,
    jsonb_array_elements_text(case when jsonb_typeof(a -> 'yearLevels') = 'array' then a -> 'yearLevels' else '[]'::jsonb end) y
    where public.is_reviewer() group by y
  union all
  select 'state', a ->> 'state', count(distinct user_id) from latest
    where public.is_reviewer() and a ->> 'state' is not null group by a ->> 'state'
$$;

revoke execute on function public.review_item(text, text, text, int, text, jsonb, text) from anon, public;
revoke execute on function public.grant_reviewer(text, text) from anon, public;
revoke execute on function public.revoke_reviewer(text) from anon, public;
revoke execute on function public.pilot_years() from anon, public;
revoke execute on function public.reviewer_name() from anon, public;
grant execute on function public.review_item(text, text, text, int, text, jsonb, text) to authenticated;
grant execute on function public.grant_reviewer(text, text) to authenticated;
grant execute on function public.revoke_reviewer(text) to authenticated;
grant execute on function public.pilot_years() to authenticated;
grant execute on function public.reviewer_name() to authenticated;
grant execute on function public.is_reviewer() to authenticated;

-- Denise is the first reviewer (Craig, 27 Nov 2026).
insert into public.reviewers (email, display_name) values ('hallidaydenise@icloud.com', 'Denise Halliday')
  on conflict (email) do nothing;

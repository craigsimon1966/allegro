-- Copied exactly from TECH_SPEC.md section 5.2. Apply with `supabase db push`.

alter table public.profiles           enable row level security;
alter table public.intakes            enable row level security;
alter table public.needs              enable row level security;
alter table public.pathway_items      enable row level security;
alter table public.unit_progress      enable row level security;
alter table public.lessons            enable row level security;
alter table public.reflections        enable row level security;
alter table public.confidence_ratings enable row level security;
alter table public.feedback           enable row level security;
alter table public.ai_calls           enable row level security;

-- Owner-only access for teacher tables
do $$
declare t text;
begin
  foreach t in array array['intakes','needs','pathway_items','unit_progress','lessons','reflections','confidence_ratings'] loop
    execute format('create policy "own rows select" on public.%I for select using (user_id = auth.uid())', t);
    execute format('create policy "own rows insert" on public.%I for insert with check (user_id = auth.uid())', t);
    execute format('create policy "own rows update" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "own rows delete" on public.%I for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

create policy "own profile select" on public.profiles for select using (user_id = auth.uid());
create policy "own profile update" on public.profiles for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_admin = (select p.is_admin from public.profiles p where p.user_id = auth.uid()));

-- Feedback: anyone may insert, only admins may read
create policy "feedback insert" on public.feedback for insert with check (true);
create policy "feedback admin read" on public.feedback for select
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin));

-- ai_calls: no client access at all (Functions use the service role)

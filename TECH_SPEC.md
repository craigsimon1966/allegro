# Allegro Learning: Technical Specification (Demo v1)

Version 0.1, 24 November 2026
Owner: Craig Simon (ZOMO Consulting Pty Ltd)
Builder: Craig, using Claude Code
Companion to: `SPEC.md` (product and design specification). Where the two disagree, `SPEC.md` wins on product behaviour and this file wins on implementation.

---

## 0. How to use this file

1. Put `SPEC.md` (the product and design spec) and this file (`TECH_SPEC.md`) in the repo root.
2. Create `CLAUDE.md` from section 2 below.
3. Do the one-off account setup in section 1 yourself (Claude Code cannot create accounts).
4. Build each milestone by pasting its prompt from section 14 into Claude Code, one milestone per session. Check the "done when" list before moving on.

---

## 1. One-off setup (Craig does this, about 1 hour)

All accounts are created under **ZOMO Consulting Pty Ltd**, using a ZOMO email address, not a RockMouse one.

| Step | Where | What to do | Output to keep |
|---|---|---|---|
| 1 | GitHub | Create private repo `zomo/allegro-demo` (or your org name) | Repo URL |
| 2 | Cloudflare | In the ZOMO Cloudflare account: Workers & Pages, Create, Pages, Connect to Git, pick the repo. Build command `npm run build`, output `dist` | Pages project name, `*.pages.dev` URL |
| 3 | Supabase | New project `allegro-demo`, region **Sydney (ap-southeast-2)**, strong DB password saved in your password manager | Project URL, anon key, service role key |
| 4 | Supabase Auth | Authentication, Providers: make sure Email is enabled (magic links use it; teachers never set a password). URL Configuration: Site URL = the Pages URL; add `http://localhost:5173` and the Pages preview pattern to Redirect URLs | |
| 5 | Supabase Auth | Email templates: edit the magic link email (section 6.4). For the pilot, set up custom SMTP (Resend, Postmark or your Google Workspace) because Supabase's built-in email is rate limited | SMTP credentials |
| 6 | Anthropic | Console: create a ZOMO workspace and an API key named `allegro-demo`. Set a **monthly spend limit** (suggest A$100 for the pilot) | API key |
| 7 | Cloudflare | Pages project, Settings, Environment variables: add every variable in section 8 for **Production** and **Preview** | |
| 8 | Repo | Copy the brand files from the Allegro project (`Allegro Logo.svg`, `Allegro Logo DG.svg`, `Allegro Purple.svg`, `Allegro icon.svg`, `AL logo trans.png`) into `/brand-source` in the repo | |
| 9 | Domain | When decided, add a custom domain to the Pages project (for example `demo.allegrolearning.com.au`) and update Supabase Site URL | |

Never paste the service role key or Anthropic key into the browser code, a commit, or a chat with Claude Code. Put them only in Cloudflare environment variables and a local `.dev.vars` file (git-ignored).

---

## 2. `CLAUDE.md` (copy into the repo root)

```markdown
# Allegro demo: rules for Claude Code

Read SPEC.md and TECH_SPEC.md before any work. Build only the milestone you are asked for.

## Non-negotiables
- Australian spelling in all UI copy and content (maths, organise, colour, personalise).
- No em dashes anywhere in UI copy or content. Use commas, full stops or parentheses.
- Never invent curriculum codes. Use AC9-TODO and NSW-TODO and list them in docs/curriculum-todo.md.
- Never put ANTHROPIC_API_KEY or SUPABASE_SERVICE_ROLE_KEY in client code. All AI calls go through functions/api/*.
- No student personal data is collected or stored.
- Every content unit you draft has reviewedBy: null. Never set reviewedBy yourself.
- Colour tokens only from src/styles/tokens.css. Never white text on sage.

## Working method
- Small commits with clear messages. Update CHANGELOG.md at the end of each milestone.
- Run `npm run check` (typecheck, lint, unit tests) before saying a milestone is done.
- If a decision is not in SPEC.md or TECH_SPEC.md, choose the simplest option, note it in docs/decisions.md and tell me.

## Commands
- npm run dev        (Vite + Pages Functions locally via wrangler)
- npm run check      (tsc, eslint, vitest)
- npm run e2e        (Playwright)
- npm run content:report
- npm run content:export-review
```

---

## 3. Architecture

```
Browser (React SPA)
   |  supabase-js (auth, reads/writes own rows under RLS)
   |------------------------------> Supabase (Sydney): Auth + Postgres
   |
   |  fetch /api/* with the user's access token (or demo session id)
   v
Cloudflare Pages Functions (functions/api/*)
   |  verify token with Supabase, rate limit, build prompt from content catalogue
   v
Anthropic Messages API
```

Principles:

- **The browser talks to Supabase directly** for the teacher's own data. Row-level security (RLS) is the security boundary, so every table has RLS on from the first migration.
- **Only the Functions talk to Anthropic.** They hold the API key, validate input and output, and apply rate limits.
- **The content catalogue is static JSON** shipped with the build (`content/`), imported by both the SPA and the Functions. No database or vector store for content in v1.
- **Demo mode** (persona, not signed in) never writes to Supabase. It uses in-memory state plus localStorage, and the Functions accept a random demo session id instead of a token, with a tighter rate limit.

### 3.1 Stack and versions

| Layer | Choice |
|---|---|
| Build | Vite 5, TypeScript 5 (strict) |
| UI | React 18, React Router 6, Tailwind CSS 3, Radix UI primitives, Lucide icons |
| State | Zustand (app state), TanStack Query (server data) |
| Maths | KaTeX with MathML output |
| Forms and validation | Zod (shared schemas in `shared/schemas.ts`) |
| Auth and DB | Supabase (`@supabase/supabase-js` v2) |
| Server | Cloudflare Pages Functions, `wrangler` for local dev |
| AI | `@anthropic-ai/sdk` |
| PDF | Browser print stylesheet first; `@react-pdf/renderer` only if print is not good enough |
| Tests | Vitest, Testing Library, Playwright, `@axe-core/playwright` |
| Lint | ESLint + Prettier |

Pin exact versions in `package.json` at M0 and do not upgrade during the pilot unless something breaks.

---

## 4. Repository layout

```
/
  SPEC.md  TECH_SPEC.md  CLAUDE.md  CHANGELOG.md  README.md
  .dev.vars.example
  content/
    units/*.json            one file per micro-unit
    modules.json
    misconceptions.json
    diagnostics.json
    personas.json           Tammy, Sam, Priya, Ms Henderson + cached AI responses
    schools.json            fictional only
    leader-demo.json        fictional aggregate data for /leader
    approved-sources.json
    tags.json               the controlled tag list the AI may use
  shared/
    schemas.ts              Zod schemas used by SPA and Functions
    types.ts
    catalogue.ts            load + query content (filter by tags, audience, year)
  functions/
    api/
      diagnose.ts  pathway.ts  explain.ts  lesson.ts  lesson-block.ts
      help.ts  reflect.ts  feedback.ts  health.ts
    _lib/
      anthropic.ts          client, model selection, retries, JSON extraction
      auth.ts               verify Supabase JWT or demo session id
      ratelimit.ts
      prompts.ts            loads prompts/*.md and fills {{placeholders}}
      respond.ts            JSON responses and error shape
  prompts/
    diagnose.md  pathway.md  explain.md  lesson.md  lesson-block.md  help.md  reflect.md
  supabase/
    migrations/*.sql
    seed.sql                (empty for pilot; personas live in content/)
  scripts/
    content-report.ts
    content-export-review.ts
    content-validate.ts
  src/
    app/                    routes, layout, providers
    components/             AllegroMark, Button, Tag, StepSquares, MarginLayout, RuledRow, AIBlock, MathText, ...
    features/               intake, needs, pathway, learn, plan, help, reflect, growth, leader, admin
    lib/                    supabase.ts, api.ts, store.ts, demo.ts, analytics.ts
    styles/tokens.css  styles/print.css
  public/brand/
  tests/unit/  tests/e2e/
  docs/
    curriculum-todo.md  decisions.md  a11y-checklist.md  review-log.md
```

---

## 5. Data model (Supabase Postgres)

All tables live in the `public` schema with RLS enabled. Every teacher-owned row has `user_id uuid not null default auth.uid()`.

### 5.1 Migration `0001_init.sql`

```sql
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
```

### 5.2 Migration `0002_rls.sql`

```sql
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
```

### 5.3 Account deletion

`/about-demo` has "Delete my account and data". It calls `POST /api/account/delete` (add to the Functions list), which verifies the token and uses the service role to call `auth.admin.deleteUser(userId)`. All teacher tables cascade from `auth.users`, so one call removes everything. Test this in M5.

### 5.4 What is never stored

- No student names or student data (enforced by UI warning, prompt rule and a server-side regex check that rejects obvious "Firstname Lastname" patterns next to words like student, kid, boy, girl).
- No prompt or response text in `ai_calls`. Debug logging of prompts is off in production (`DEBUG_PROMPTS` unset).

---

## 6. Authentication

### 6.1 Flows

| Flow | How it works |
|---|---|
| Sign in | `/signin`: email field, "Send me a link". Calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: origin + '/auth/callback' } })` |
| Callback | `/auth/callback` exchanges the code (PKCE, the supabase-js default), then routes to `/start` for a new profile or `/pathway` for a returning one |
| Demo | `/demo`: choosing a persona sets `mode = 'demo'` in the store, creates a random `demoSessionId`, and loads that persona's cached state from `content/personas.json` |
| Upgrade | A demo user can tap "Save my progress" to sign in; the client then writes its demo state to Supabase once |
| Sign out | Clears the Supabase session and the local store |

### 6.2 Access gate

If `VITE_REQUIRE_ACCESS_CODE=true`, `/demo` and `/signin` ask for `DEMO_ACCESS_CODE` first. The code is checked by `POST /api/access` (constant-time compare) which sets a signed, http-only cookie for 30 days. Keep this on for the pilot.

### 6.3 Allowed emails (optional for the pilot)

Supabase can't restrict sign-ups to a list on its own. If you want only pilot teachers to sign in, add an `allowed_emails` table and a Supabase Auth hook ("before user created") that rejects other addresses. Decide before M1 (see section 15).

### 6.4 Magic link email copy

Subject: `Your Allegro sign-in link`
Body: `Hi, here's your link to sign in to Allegro Learning. It works once and expires in 1 hour. If you didn't ask for this, you can ignore this email.` Button: `Sign in to Allegro`.

---

## 7. API (Cloudflare Pages Functions)

### 7.1 Common rules

- All endpoints are `POST`, JSON in and JSON out, except `GET /api/health`.
- Auth header: `Authorization: Bearer <supabase access token>` **or** `X-Demo-Session: <uuid>`. Neither present → 401.
- `auth.ts` verifies the token with `supabase.auth.getUser(token)` (anon key client). Cache the result for the request only.
- Every request body is parsed with its Zod schema from `shared/schemas.ts`. Invalid → 400.
- Error shape for every failure: `{ "error": { "code": "rate_limited" | "invalid_input" | "ai_unavailable" | "ai_invalid_output" | "unauthorised" | "server_error", "message": "<plain English for the UI>" } }`.
- Rate limits (counted from `ai_calls` in the last hour): signed-in 40, demo 15, configurable by env. Over the limit → 429 with `retryAfterSeconds`.
- Timeouts: 25 seconds for AI calls. On timeout or 5xx from Anthropic, retry once with backoff; then return `ai_unavailable`. The UI falls back to cached persona output (demo) or a friendly retry card (signed in).
- Log one `ai_calls` row per AI request (service role), never the content.

### 7.2 Endpoints

| Endpoint | Request | Response | Model | Max output tokens |
|---|---|---|---|---|
| `POST /api/diagnose` | `{ situationText, guided?: {role, subject, yearLevels, schoolType, locationType, weeks, hoursPerWeek, teachingDays}, clarifyingAnswers?: string[] }` | `Diagnosis` (SPEC 8.3) | main | 1,500 |
| `POST /api/pathway` | `{ needs: Need[], hoursPerWeek, teachingDays, startDate }` | `{ items: [{unitId, needId, reason, scheduledFor, sortOrder}], external: [{sourceId, reason}] }` | main | 1,200 |
| `POST /api/explain` | `{ unitId, style: 'simpler' \| 'different_context', context?: string }` | stream of text | fast | 400 |
| `POST /api/lesson` | `{ topicTag, yearLevel, durationMinutes, classProfile, lastLesson?, carryIn?: string[] }` | `Lesson` (SPEC 8.4) | main | 3,500 |
| `POST /api/lesson-block` | `{ lesson: Lesson, blockId, instruction? }` | `LessonBlock` | main | 1,000 |
| `POST /api/help` | `{ question, context?: {unitId?, yearLevel?} }` | stream of text, then a final JSON line `{ unitId?: string }` | fast | 350 |
| `POST /api/reflect` | `{ tried, happened, nextTime, needIds: string[] }` | `{ observation, suggestedUnitId }` | fast | 300 |
| `POST /api/feedback` | `{ sessionId, target, thumbs?, scores?, comment? }` | 204 | none | |
| `POST /api/account/delete` | `{}` | 204 | none | |
| `POST /api/access` | `{ code }` | 204 + cookie | none | |
| `GET /api/health` | | `{ ok, version, contentVersion }` | none | |

### 7.3 Grounding rules enforced in code (not just in prompts)

- **Tags:** `diagnose` output tags are filtered against `content/tags.json`. Unknown tags are dropped, not passed on.
- **Unit ids:** `pathway`, `help` and `reflect` may only return unit ids that exist in the catalogue. Unknown ids are dropped; if `pathway` ends up empty, fall back to a rules-based selection (match tags and audience, order by priority then difficulty).
- **Time budget:** `pathway` output is post-processed in code so the scheduled minutes per week never exceed `hoursPerWeek * 60`, and nothing is scheduled on teaching days unless the teacher has no free days. The AI suggests; the code enforces.
- **Misconceptions:** the `misconceptions` block in `lesson` is always rebuilt in code from `misconceptions.json` for the topic tag, replacing whatever the model wrote. The model's version is discarded.
- **Curriculum refs:** always taken from the unit metadata in code (`AC9-TODO` / `NSW-TODO` until verified). The model is never asked for codes.
- **External links:** only `sourceId`s from `approved-sources.json`; the URL comes from the file.
- **Explain:** the prompt includes only that unit's own text; the response is labelled AI in the UI.

### 7.4 JSON from the model

Use the Messages API with a system prompt and ask for JSON only. In `anthropic.ts`:

1. Extract the first JSON object from the response text.
2. Validate with Zod.
3. If invalid, call once more with the validation errors appended ("Your last reply did not match the schema: ... Reply with corrected JSON only.").
4. If still invalid, return `ai_invalid_output`; the UI offers the guided form (diagnose) or a retry.

If structured outputs or tool-use based JSON is available on the chosen model when you build, prefer it over text extraction; keep the Zod check either way.

### 7.5 Prompts

- One Markdown file per endpoint in `prompts/`, with `{{placeholders}}` filled by `prompts.ts`. Craig or Denise can edit wording without touching code.
- Every prompt starts with the shared preamble: Australian spelling, no em dashes, collegial tone, never ask for student information, never invent curriculum codes or URLs.
- `diagnose.md` uses the skeleton in SPEC 8.6, with `{{TAG_LIST}}` from `tags.json`.
- `pathway.md` receives needs plus a compact catalogue listing (id, title, domain, tags, minutes, difficulty, audience) for units matching the needs' tags, not the whole catalogue.
- `lesson.md` receives the matching units' core ideas and worked examples as reference, and must mark every block `source: "ai_draft"` and `needs_maths_check: true` unless it copies a seeded worked example verbatim.

### 7.6 Models and cost control

| Env var | Default | Used by |
|---|---|---|
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | diagnose, pathway, lesson, lesson-block |
| `ANTHROPIC_MODEL_FAST` | `claude-haiku-5-5` | explain, help, reflect |

Check the current model names in the Anthropic docs at build time. Cost controls: the console spend limit (section 1), per-user rate limits, max output tokens per endpoint, cached persona responses for every demo path, and a `GET /api/health` field showing AI calls in the last 24 hours for a quick sanity check.

---

## 8. Environment variables

| Name | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Pages (build) | Public |
| `VITE_SUPABASE_ANON_KEY` | Pages (build) | Public, safe in the browser because of RLS |
| `VITE_REQUIRE_ACCESS_CODE` | Pages (build) | `true` for the pilot |
| `SUPABASE_URL` | Pages (runtime) | |
| `SUPABASE_ANON_KEY` | Pages (runtime) | For token verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Pages (runtime) | **Secret.** Only for `ai_calls`, account delete and admin export |
| `ANTHROPIC_API_KEY` | Pages (runtime) | **Secret** |
| `ANTHROPIC_MODEL`, `ANTHROPIC_MODEL_FAST` | Pages (runtime) | |
| `DEMO_ACCESS_CODE` | Pages (runtime) | **Secret** |
| `ACCESS_COOKIE_SECRET` | Pages (runtime) | **Secret**, 32+ random bytes |
| `RATE_LIMIT_USER_PER_HOUR` | Pages (runtime) | Default 40 |
| `RATE_LIMIT_DEMO_PER_HOUR` | Pages (runtime) | Default 15 |
| `DEBUG_PROMPTS` | local only | Never set in production |

Local development uses `.dev.vars` (wrangler) for runtime values and `.env.local` for `VITE_*`. Both are git-ignored; commit `.dev.vars.example` with blank values.

---

## 9. Front end

### 9.1 Routing and guards

- Public: `/`, `/demo`, `/signin`, `/auth/callback`, `/about-demo`.
- Teacher app (demo or signed in): `/start`, `/needs`, `/pathway`, `/learn/:unitId`, `/plan`, `/plan/:lessonId`, `/reflect`, `/growth`, `/help`.
- `/leader`: available in both modes, always shows `leader-demo.json` with a "Fictional data" banner.
- `/admin/feedback`: signed in and `profiles.is_admin = true`, else redirect home.
- A `useMode()` hook returns `'demo' | 'signed_in' | 'anonymous'`. A data layer in `src/lib/api.ts` reads and writes through Supabase when signed in and through the local demo store when in demo mode, so feature components never branch on mode.

### 9.2 Design tokens

Implement SPEC 10.1 to 10.3 as CSS variables in `src/styles/tokens.css` and map them in `tailwind.config.ts` (`colors.sage.500`, `colors.green.700`, and so on). Add an ESLint rule or a unit test that fails if any component uses a raw hex colour outside `tokens.css`.

### 9.3 Key components

| Component | Notes |
|---|---|
| `AllegroMark` | Props `product: 'equip' \| 'embed' \| 'evaluate' \| 'elevate' \| 'all'`, `size`. Built from the cleaned logo paths. Clockwise from top-left: Equip, Embed, Evaluate, Elevate |
| `StepSquares` | Six small squares, filled Green 700 when done, shown with "Step n of 6" |
| `MarginLayout` | Page shell with the 52px margin column and plum margin line (main column only on laptop) |
| `RuledRow` | Row with a margin slot (number, tick, timing or note) and ruled bottom line |
| `Highlight` | Highlighter span (`--highlighter` behind the lower part of the text) |
| `MarginNote` | Caveat annotation; enforces one line and 20px minimum |
| `TabBar` / `Sidebar` | Phone bottom tabs (Week, Lessons, Growth, Me) and the laptop Contents sidebar |
| `VoiceInputButton` | Web Speech API where available; hidden when unsupported |
| `AIBlock` | Full-width Plum 100 band, "AI" or "AI DRAFT" label, "Drafted by Allegro AI. Please check before using." line, Regenerate and Edit actions, "Maths checked" tick where relevant |
| `DraftBadge` | Shown on any unit with `reviewedBy: null` |
| `MathText` | Renders Markdown with KaTeX (MathML output for screen readers) |
| `QuickHelpButton` | "Ask a question" button sitting above the tab bar on phone and tablet (SPEC 10.6); opens a Radix Dialog slide-over. On laptop, Quick Help docks on the right instead |

### 9.4 Print and PDF

`src/styles/print.css` hides app chrome and prints the lesson plan on A4 with 15mm margins. "Download PDF" uses `window.print()` with a "Save as PDF" hint. Only build a PDF library if print output fails the 2-page check in M3.

### 9.5 Accessibility checks in code

- `@axe-core/playwright` runs on every route in the e2e suite and fails on any violation.
- A unit test checks that every colour pair used for text in `tokens.css` meets 4.5:1 (or 3:1 for tokens marked large-only).

---

## 10. Content pipeline

### 10.1 Format

One JSON file per micro-unit in `content/units/`, matching the `MicroUnit` type in SPEC 9.1. `scripts/content-validate.ts` checks every file against the Zod schema, that every tag is in `tags.json`, every `misconceptionId` exists, and every unit is between 3 and 8 minutes. `npm run check` runs it.

### 10.2 Drafting

Claude Code drafts units in M2 following SPEC 9.2, with `reviewedBy: null`. It must not set `reviewedBy`.

### 10.3 Review by Denise Halliday

1. `npm run content:export-review` writes `review/allegro-content-review.docx` (and a `.md` copy): one section per unit with its id, all text, worked examples, check items with answers, linked misconceptions, and a blank "Reviewer notes" and "Approved (Y/N)" line. Use the `docx` npm package.
2. Craig sends the document to Denise. She marks changes and approvals.
3. Craig (or Claude Code, from Denise's marked-up file) applies her changes to the JSON files.
4. For each approved unit, Craig sets `"reviewedBy": "Denise Halliday"` and `"reviewedOn": "YYYY-MM-DD"` by hand, and records it in `docs/review-log.md`.
5. `npm run content:report` lists unreviewed units, units changed since review (compare a content hash stored at review time), and outstanding `AC9-TODO` / `NSW-TODO` codes.

**Pilot gate:** `content:report` must show zero unreviewed units, zero changed-since-review units, and zero TODO codes before teachers get access. Add this as a CI check on the `main` branch once M5 is done.

### 10.4 Curriculum codes

`docs/curriculum-todo.md` lists each unit with the AC v9 content descriptions and NSW Mathematics K-10 outcomes it needs. Craig or Denise looks them up on the ACARA and NSW Curriculum sites and fills them in. Claude Code never fills them.

---

## 11. Testing

| Level | What | When |
|---|---|---|
| Unit (Vitest) | Schemas, catalogue queries, pathway time-budget enforcement, student-name detector, contrast test, content validation | Every commit via `npm run check` |
| Component | AIBlock, StepSquares, RuledRow, MarginNote (one-line rule), MathText, forms | Every commit |
| E2E (Playwright, AI mocked) | Full Tammy loop in demo mode; signed-in loop using a Supabase test user and a mocked `/api/*`; axe on every route | Every PR |
| E2E (real AI) | One Tammy loop against the preview deployment with the real API | Before each production deploy, run by hand |
| Manual | Keyboard-only pass, VoiceOver on iPad, NVDA on Windows, iPad and Chromebook layouts | Before pilot, logged in `docs/a11y-checklist.md` |
| Security | Try to read another user's rows with a second test account (must fail); confirm no secrets in the built JS (`grep` the `dist` folder for `sk-ant` and the service role key prefix) | M5 |

Mock AI responses live in `tests/fixtures/ai/*.json` and are reused for the cached persona responses.

---

## 12. Deployment and environments

| Environment | Source | URL | Data |
|---|---|---|---|
| Local | your machine | `localhost:5173` | Supabase project (or a second "dev" project if you prefer isolation) |
| Preview | every pull request branch | `<branch>.<project>.pages.dev` | Same Supabase project, test accounts only |
| Production | `main` branch | custom domain | Pilot teachers |

- Cloudflare Pages builds automatically on push. Supabase migrations are applied by hand with the Supabase CLI (`supabase db push`) before merging a PR that needs them.
- Add a GitHub Action that runs `npm run check` and the mocked e2e suite on every PR. Block merge on failure.
- Tag each production deploy (`v0.1.0`, ...) and note it in `CHANGELOG.md`.
- Rollback: Cloudflare Pages dashboard, Deployments, "Rollback to this deployment".

---

## 13. Operations during the pilot

- **Weekly check (10 minutes):** Anthropic console spend; `/admin/feedback`; Supabase Auth users list; `GET /api/health`.
- **Backups:** Supabase daily backups are included on the Pro plan. On the free plan, run `supabase db dump` weekly to a ZOMO drive folder, or upgrade for the pilot.
- **Incidents:** if a maths error is reported, mark the unit `reviewedBy: null` (it shows the Draft badge again), fix, re-review with Denise, redeploy.
- **Privacy requests:** account deletion is self-serve; for anything else, Craig handles it from the Supabase dashboard.
- **End of pilot:** export feedback CSV, then decide whether to keep or purge teacher data, and tell teachers which.

---

## 14. Milestone build prompts (paste one per Claude Code session)

Each prompt assumes Claude Code has read `CLAUDE.md`, `SPEC.md` and `TECH_SPEC.md`.

### M0. Foundations

```
Build milestone M0 from SPEC.md section 15 and TECH_SPEC.md.
- Scaffold the stack in TECH_SPEC 3.1 and the folder layout in TECH_SPEC 4. Pin exact versions.
- Implement design tokens (SPEC 10.1 to 10.3) in src/styles/tokens.css and tailwind.config.ts.
- Load Literata, Atkinson Hyperlegible and Caveat (Google Fonts). Add KaTeX.
- Clean the brand SVGs from /brand-source into public/brand/ (remove background rects; make logo-green.svg in Green 700).
- Build AllegroMark (clockwise: Equip TL, Embed TR, Evaluate BR, Elevate BL), Button, Tag, StepSquares, MarginLayout, RuledRow, Highlight, MarginNote, TabBar, Sidebar, AIBlock, DraftBadge, MathText. Follow the exercise book rules in SPEC 10.2, 10.3 and 10.6a: no cards, 2px corners, ruled lines.
- Build the landing page (SPEC 7.1), /about-demo placeholder and a /styleguide route showing every token and component.
- Set up wrangler for local Pages Functions with GET /api/health.
- Add npm scripts: dev, build, check, e2e. Add the colour contrast unit test and the no-raw-hex rule.
- Add the GitHub Action for check + e2e.
Done when: npm run check passes, axe shows zero violations on / and /styleguide, landing hero and CTA are above the fold at 375px wide.
```

### M1. Auth, intake and diagnosis

```
Build milestone M1.
- Write supabase/migrations/0001_init.sql and 0002_rls.sql exactly as TECH_SPEC 5.1 and 5.2. Tell me when to run supabase db push.
- Implement auth (TECH_SPEC 6): /signin, /auth/callback, access-code gate with POST /api/access, useMode(), demo mode with personas from content/personas.json.
- Implement functions/_lib (anthropic.ts, auth.ts, ratelimit.ts, prompts.ts, respond.ts) and POST /api/diagnose with Zod validation, one retry on invalid JSON, tag filtering and ai_calls logging.
- Write prompts/diagnose.md from SPEC 8.6. Create content/tags.json.
- Build /demo, /start (SPEC 7.3, including the student-name warning) and /needs (SPEC 7.4) with the diagnostic check using content/diagnostics.json (draft items, reviewedBy null).
- Cached persona diagnoses for Tammy, Sam and Priya so demo mode works with no AI call.
- Data layer in src/lib/api.ts that writes to Supabase when signed in and to the local store in demo mode.
Done when: Playwright completes Tammy's demo path to /needs with AI mocked; a signed-in test user's intake and needs are saved and visible only to that user; invalid model JSON falls back to the guided form.
```

### M2. Content, pathway and learning

```
Build milestone M2.
- Draft the seed content in SPEC 9.2 as JSON in content/ (units, modules, misconceptions, diagnostics). Every unit reviewedBy: null. Use AC9-TODO and NSW-TODO and list each in docs/curriculum-todo.md. Australian spelling, no em dashes.
- Add scripts/content-validate.ts, content-report.ts and content-export-review.ts (TECH_SPEC 10). The export writes review/allegro-content-review.docx using the docx package.
- POST /api/pathway with code-enforced time budget and teaching-day rules (TECH_SPEC 7.3), rules-based fallback, and prompts/pathway.md.
- POST /api/explain (streamed) with prompts/explain.md.
- Build /pathway (SPEC 7.5) and /learn/:unitId (SPEC 7.6), including "Add to my lesson".
Done when: unit tests prove the time budget is never exceeded; every unit passes content-validate; content:export-review produces a readable document; Draft badges show on all units.
```

### M3. Lesson Builder

```
Build milestone M3.
- POST /api/lesson and /api/lesson-block with prompts/lesson.md and lesson-block.md. Rebuild the misconceptions block and curriculum refs in code (TECH_SPEC 7.3).
- Build /plan and /plan/:lessonId (SPEC 7.7): block editor, reorder, edit, regenerate one block, "Check the maths" banner until ticked, save to lessons table when signed in.
- Print stylesheet (TECH_SPEC 9.4).
Done when: a 60-minute lesson prints on 2 A4 pages or fewer; regenerating one block leaves the others byte-identical; misconceptions always come from misconceptions.json.
```

### M4. Reflect, growth and Quick Help

```
Build milestone M4.
- POST /api/reflect and /api/help (streamed, final JSON line with optional unitId) with their prompts.
- Build /reflect (SPEC 7.9), /growth (SPEC 7.10) with an accessible chart and a text summary, and the Quick Help slide-over and /help page (SPEC 7.8).
- Store reflections and confidence_ratings when signed in.
Done when: Quick Help answers are under 120 words by default; reflections are never readable by another test user; the growth chart has a text alternative.
```

### M5. Leader preview, feedback, hardening and deploy

```
Build milestone M5.
- /leader with content/leader-demo.json and a "Fictional data" banner (SPEC 7.11).
- Feedback capture (SPEC 14): thumbs on diagnosis, pathway, units, lesson, help; end-of-loop survey; POST /api/feedback; /admin/feedback for is_admin users with CSV export.
- POST /api/account/delete and the delete button on /about-demo. Write the full /about-demo page (SPEC 7.12).
- Error states for every AI endpoint, 429 handling, offline message.
- Security checks in TECH_SPEC 11. Add the pilot gate CI check from TECH_SPEC 10.3.
- Deploy to production and run the real-AI Tammy loop against it.
Done when: everything in SPEC 15 M5 passes, the security checks pass, and docs/a11y-checklist.md is filled in.
```

---

## 15. Decisions to make before or during the build

| # | Decision | Needed by | Default if not decided |
|---|---|---|---|
| 1 | Restrict sign-in to an allow-list of pilot emails? | M1 | Yes: allow-list plus access code |
| 2 | Pilot teachers sign in with personal or school/department emails? | Before recruiting | Personal emails, which avoids department IT approval for a small pilot; confirm with schools |
| 3 | Custom SMTP provider for magic links | M1 | Resend, sending from a ZOMO domain |
| 4 | Supabase free or Pro plan for the pilot | M5 | Pro for daily backups |
| 5 | Demo domain | M5 | Use the `pages.dev` URL until decided |
| 6 | Denise's review format and turnaround | Start of M2 | The exported Word document, one batch of about 30 units |

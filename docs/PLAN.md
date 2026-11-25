# Allegro demo: build plan

Last updated 24 November 2026. Source documents: `SPEC.md` (product and design), `TECH_SPEC.md` (implementation), `design/` (reference screens). Open contradictions and gaps are in `docs/spec-issues.md`.

## Goal

Get the **one loop** in SPEC section 1 working end to end, in front of real teachers, as early as possible:

> Tell Allegro your situation → see what you need → 5-minute learning that fits your week → tomorrow's lesson → reflect.

Everything is ordered so that a clickable **persona demo** (Tammy, no sign-in, cached AI) exists early, and the harder pieces (real AI, sign-in, content review, deploy) are layered on without breaking it.

## The critical path is content review, not code

Code milestones are each roughly one to three Claude Code sessions. The slowest part of the project is outside the code: **Denise Halliday has to review about 26 units, the diagnostic items and the misconception bank, and someone has to look up every curriculum code** before any teacher sees the pilot (TECH_SPEC 10.3 pilot gate). So this plan pulls content drafting forward to run alongside M1, rather than waiting for M2 as the spec orders it. That's the one deliberate change to the spec's milestone order, and it only moves drafting, not any app code.

## Phases at a glance

| Phase               | What                                        | Who                | Depends on                | Result                                                  |
| ------------------- | ------------------------------------------- | ------------------ | ------------------------- | ------------------------------------------------------- |
| 0                   | Repo scaffold and plan (this PR)            | Claude Code        | nothing                   | Stack, tooling, CI, tokens, route stubs                 |
| A                   | One-off accounts (TECH_SPEC 1)              | Craig              | nothing, can start now    | Cloudflare, Supabase (Sydney), Anthropic keys, SMTP     |
| M0                  | Foundations                                 | Claude Code        | Phase 0, brand files (G1) | Real landing page, components, styleguide               |
| M1                  | Auth, intake, diagnosis                     | Claude Code        | M0, Phase A               | Tammy can reach `/needs`; sign-in works                 |
| C1                  | Draft content (pulled forward)              | Claude Code        | M0 types                  | 26 draft units, misconceptions, diagnostics, review doc |
| R                   | Content review and curriculum codes         | Denise, Craig      | C1                        | Units signed off; `AC9-TODO`/`NSW-TODO` filled          |
| M2                  | Pathway and learning                        | Claude Code        | M1, C1                    | Pathway week view and micro-unit player                 |
| **Demo checkpoint** | Persona loop to `/learn` on a preview URL   | Craig              | M2                        | First show-and-tell with 2 or 3 friendly teachers       |
| M3                  | Lesson Builder                              | Claude Code        | M2                        | Editable, printable lesson plan                         |
| M4                  | Reflect, growth, Quick Help                 | Claude Code        | M3                        | Full loop closes                                        |
| M5                  | Leader preview, feedback, hardening, deploy | Claude Code, Craig | M4, R                     | Pilot-ready production URL                              |

## Phase 0: repo scaffold (done in this PR)

- Vite 5, React 18, TypeScript (strict), React Router 6, Tailwind 3, Zustand, TanStack Query, KaTeX, Zod, Supabase JS, Radix Dialog, Lucide, Anthropic SDK. Exact versions pinned.
- Cloudflare Pages Functions with `wrangler`; `GET /api/health` works locally through `npm run dev`.
- Folder layout from TECH_SPEC 4, with READMEs where folders are still empty.
- `src/styles/tokens.css` with every SPEC 10.1 token, mapped into `tailwind.config.ts` (Tailwind's default palette is removed so only tokens can be used).
- Tests already in place: no raw hex outside `tokens.css`; WCAG contrast for every text pair in SPEC 10.1; landing renders; Playwright smoke test with axe at phone and laptop sizes.
- GitHub Action runs `npm run check`, build and e2e on every PR.
- `SPEC.md`, `TECH_SPEC.md`, `CLAUDE.md`, `design/` reference screens committed.

## Phase A: Craig's one-off setup (about an hour, can start now)

Follow TECH_SPEC section 1. Things that block later milestones:

1. **Brand SVGs** into `brand-source/` (blocks M0 logo work).
2. **Supabase project in Sydney**, with Auth redirect URLs (blocks M1).
3. **Anthropic API key with a monthly spend limit** (blocks real AI in M1; mocks work without it).
4. **Cloudflare Pages project** connected to this repo (gives preview URLs for each PR).
5. **SMTP for magic links** (Resend by default). Supabase's built-in email is fine for testing but rate limited.
6. Repo location is settled: it stays at `craigsimon1966/allegro`.

## M0: Foundations (built 24 November 2026, see CHANGELOG)

Build (TECH_SPEC 14, M0 prompt; the scaffold parts are already done):

- Cleaned brand assets in `public/brand/`, favicon.
- Components: `AllegroMark` (Equip TL, Embed TR, Evaluate BR, Elevate BL), `Button`, `Tag`, `StepSquares`, `MarginLayout`, `RuledRow`, `Highlight`, `MarginNote`, `TabBar`, `Sidebar`, `AIBlock`, `DraftBadge`, `MathText`. Match `design/00-Foundations.html`.
- Full landing page (SPEC 7.1), `/about-demo` placeholder, `/styleguide` showing every token and component.
- Self-host or preload fonts so the landing page stays under 200KB JS and doesn't flash.

Done when: `npm run check` passes; axe clean on `/` and `/styleguide`; hero and CTA above the fold at 375px; Lighthouse accessibility 95+.

Decisions needed first: AI disclosure wording (spec-issues #6).

## M1: Auth, intake and diagnosis (built without accounts 24 November 2026, see CHANGELOG)

Still needs Craig's Supabase project and Anthropic key: run the migrations, switch on the allow-list hook, set the env vars, then test real sign-in, the cross-user read check and a real-AI diagnosis.

- Migrations `0001_init.sql` and `0002_rls.sql` exactly as TECH_SPEC 5; plus `0003_allowed_emails.sql` if the allow-list default stands (G7).
- `/signin`, `/auth/callback`, access-code gate (`POST /api/access`, signed cookie, also enforced on `/api/*`, see G8).
- `functions/_lib/*` and `POST /api/diagnose` (Zod, one retry, tag filtering, `ai_calls` logging, rate limits).
- `prompts/diagnose.md`, `content/tags.json`, `content/personas.json` with cached diagnoses for Tammy, Sam, Priya.
- Screens `/demo`, `/start` (student-name warning, voice input, guided fields), `/needs` (diagnostic check, honest calibration message). Match `design/Mobile-01` to `Mobile-03`.
- `src/lib/api.ts` data layer that hides demo vs signed-in mode.

Done when: Playwright completes Tammy's demo path to `/needs` with AI mocked; a second test user can't read the first user's rows; invalid model JSON falls back to the guided form.

Decisions needed first: allow-list (TECH_SPEC 15 #1), SMTP provider (#3).

## C1: Draft content (runs alongside M1)

- Draft the SPEC 9.2 set: 26 units, 12 misconceptions, 4 diagnostic items per CK topic, modules. All `reviewedBy: null`, all codes `AC9-TODO` / `NSW-TODO`.
- `scripts/content-validate.ts`, `content-report.ts`, `content-export-review.ts` (Word document for Denise).
- `docs/curriculum-todo.md` listing what each unit needs looked up.
- Send the review document to Denise as soon as it exists. Her turnaround sets the pilot date (SPEC 16 open question 1).

## M2: Pathway and learning

- `POST /api/pathway` with the time budget and teaching-day rules enforced in code, rules-based fallback.
- `POST /api/explain` (streamed, grounded in the unit only).
- `/pathway` week view ("Before Monday" band, reorder) and `/learn/:unitId` player with Draft badges and "Add to my lesson". Match `design/Mobile-04`, `Mobile-05`, `Desktop-Pathway`.

Done when: unit tests prove the time budget is never exceeded; every unit validates; Draft badges show.

Status (25 Nov 2026): demo slice done. Rules-based pathway in `shared/pathway.ts` (runs in the browser), 22 draft units, /pathway and /learn built, unbuilt screens say "coming soon". `/api/explain` and Supabase saving for signed-in teachers followed the same day. Still to do: `/api/pathway` AI reasons (optional; the rules version meets the done-when).

**Demo checkpoint:** deploy a Cloudflare preview and walk 2 or 3 friendly teachers through Tammy's path up to a finished micro-unit. Cheap way to test the "fits my actual situation" measure before building the Lesson Builder.

## M3: Lesson Builder

- `POST /api/lesson` and `/api/lesson-block`; misconceptions and curriculum refs rebuilt in code.
- `/plan` and `/plan/:lessonId`: block editor, single-block regenerate, "Check the maths" banner, margin timings, print stylesheet. Match `design/Mobile-06`, `Desktop-Lesson`.

Done when: a 60-minute lesson prints on 2 A4 pages or fewer; regenerating one block leaves the rest byte-identical.

Status (25 Nov 2026): built. All three done-when checks have tests.

## M4: Reflect, growth and Quick Help

- `POST /api/reflect`, `POST /api/help` (streamed, final JSON line).
- `/reflect`, `/growth` (chart plus text alternative, no badges or streaks), Quick Help slide-over and `/help`. Match `design/Mobile-07`, `Mobile-08`.

Done when: Quick Help answers are under 120 words by default; reflections are private to their owner; the growth chart has a text alternative.

## M5: Leader preview, feedback, hardening, deploy

- `/leader` with fictional data; thumbs and end-of-loop survey; `/admin/feedback` with CSV export.
- `POST /api/account/delete`; full `/about-demo` (including voice input note, G11).
- Error, 429 and offline states; security checks (cross-user reads, secrets in `dist`).
- Pilot gate in CI: zero unreviewed units, zero changed-since-review, zero TODO codes.
- Production deploy, real-AI Tammy loop, manual screen reader pass in `docs/a11y-checklist.md`.

Decisions needed first: Supabase plan (Pro for backups), demo domain.

## Risks worth watching

| Risk                                       | Why it matters                                                       | Mitigation                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Review turnaround                          | Pilot can't start until every unit is signed off                     | Start C1 early; agree Denise's dates now; consider reviewing in two batches (Tammy's units first)    |
| AI maths errors in lesson drafts           | One wrong example loses a maths teacher's trust (SPEC P7)            | Misconceptions and codes rebuilt in code; "Check the maths" banner; seeded worked examples preferred |
| Persona demo drifts from real AI behaviour | Cached responses can make the demo look better than the live product | Re-generate cached responses from the real prompts at M5 and review them                             |
| Department email sign-ins                  | Can trigger privacy review or ST4S                                   | Default to personal emails; confirm with pilot schools before recruiting                             |
| Scope creep into Elevate                   | Four products in one demo makes four shallow ones (SPEC P8)          | Leader preview stays static fictional data                                                           |

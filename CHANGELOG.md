# Changelog

## Unreleased

- The first download is about half the size again (164 KB down to 88 KB gzipped). The error page added earlier had pulled the Supabase client into the entry script; it now loads the error reporter only when a page crashes. New `npm run size:dist` (run in CI after the build) fails if the entry script goes over 110 KB gzipped or contains the Supabase client.
- `GET /api/health` now does what TECH_SPEC 7.6 and 13 ask: the live commit, a content version (unit count, reviewed count and a fingerprint), and AI calls in the last 24 hours. It also says yes or no (never the value) for the Anthropic key, Supabase, the service role key and the demo access code, and whether rate limits count in the database. /admin/feedback shows this as a "Live setup" list with what each missing setting breaks.
- Each screen now names the browser tab after its heading, for example "This week · Allegro Learning" (WCAG 2.4.2). Before, every tab said "Allegro Learning".
- Moving to a new screen puts focus on its heading, so VoiceOver and NVDA announce the new page instead of staying silent (WCAG 2.4.3). The first page load is left alone.
- Every screen now has a "Skip to main content" link as the first Tab stop (WCAG 2.4.1). It was on the manual checklist but had never been built.
- New `tests/e2e/a11y.spec.ts` automates four rows of the manual accessibility checklist: skip link, no sideways scrolling at 320px (200% zoom) and at Chromebook 1366 x 768, visible keyboard focus on This week, and no animation with reduced motion. Those rows are marked "Pre-checked" in `docs/a11y-checklist.md`.
- Each unit on This week has a day picker (SPEC 7.5: learning goes on non-teaching days by default, editable). Teaching days are marked "(teaching)". The choice is saved with the week, in the browser and in Supabase when signed in.
- Further reading on This week now shows the AI's picks first, each with a one-line reason labelled "Suggested for you by Allegro AI". Links still come only from `content/approved-sources.json`, and only sources for the teacher's year levels appear. Personas see the plain list as before.
- New `POST /api/pathway` (TECH_SPEC 7.2, 7.3) with `prompts/pathway.md`. For teachers using their own situation or signed in, the AI now chooses the week's units and writes each "Why this?" reason. The code keeps only real units and needs, never goes over the hours, keeps learning off teaching days, and only passes on approved source ids. If the AI is down or picks nothing usable, the rules week is used. Demo personas stay on rules, with no AI call.
- The Me tab opens a new /me page: who you are, Sign out (or Leave the demo, Try a different teacher), and links to your needs, your situation, the pilot survey and About this demo.
- `npm run content:validate` now exists (it was listed but never written). It checks every unit against the schema, tags, misconception and module links, 3 to 8 minutes, MCQ answers and em dashes, and the same checks run in `npm run check`.
- This week has an optional "Further reading" section (SPEC 7.5) with the 7 sources Craig approved, kept in `content/approved-sources.json`. Primary teachers don't see the 7 to 10 syllabus page. A unit test fails if any other external link appears in the app or content.
- Growth shows the one-line notes teachers write at the end of each unit (SPEC 7.6), under "Notes from your units". They were saved but not shown.
- On a laptop, units on This week can be dragged into a new order (SPEC 7.5). The up and down buttons stay for touch screens and keyboards.
- Pilot error reporting: a page crash shows a friendly "Something went wrong" screen instead of a blank page, and crashes are reported (message, page, build, top of the stack, nothing the teacher typed) to the anonymous feedback table. Admins see them under "Errors in teachers' browsers" on /admin/feedback.
- On a laptop, a lesson plan has a "Why this block works" panel on the right (design/Desktop-Lesson). It follows the block you are reading or editing and links the related units.
- Quick Help has the microphone too (SPEC 10.6a), where the browser supports speech input, with the same privacy note as the situation box.
- On a laptop, Quick Help docks on the right of This week (design/Desktop-Pathway), so teachers can ask while looking at their week.
- Sam and Priya walkthrough fixes: tapping the middle of an unrated confidence slider now records 3 of 5 (before, nothing happened); unrated sliders look faded; the thumbs-up and thumbs-down buttons stay together on narrow phones; the Growth numbers line up.
- Quick Help opens over the current screen from "Ask a question" (a bottom sheet on phone, a side sheet on tablet), so teachers keep their place. The /help page still works.
- Each build serves `/version.txt` (and an `allegro-build` meta tag) with its commit, so it is easy to see which version is live.
- Sign-in: an "I already have a code" link opens the code box straight away, and the code box also appears if an email was sent a moment ago.

### Read the marked-up review back in (25 November 2026)

- `npm run content:import-review -- <marked-up.docx>` reads Denise's file (with Track Changes and comments) and writes `review/review-summary.md`: Approved Y/N, reviewer and date, notes, comments, codes she wrote, and how many tracked changes each item has. It changes no content, and prints the `content:approve` command for units approved with no edits.

### Add to Home Screen (25 November 2026)

- Web app manifest, Home Screen icons (192, 512, Apple 180, safe for round crops) and Apple meta tags. Opens full screen at the teacher's week.
- About page explains how to add it on iPhone, iPad and Android, and that it keeps iPhone and iPad sign-ins from being cleared after 7 days.
- `scripts/build-icons.ts` rebuilds the icons from the brand mark.
- No offline caching (service worker) yet, so nothing can serve a stale build.

### Sign in with a code (25 November 2026)

- After asking for a sign-in email, teachers type the 6-digit code from it (`verifyOtp`), or tap the link as before. Clear messages for a wrong or expired code, and "Use a different email".
- `supabase/email-templates/magic-link.html`: the email template to paste into Supabase, showing the code and the link.

### Content review document (25 November 2026)

- Drafted the rest of the SPEC 9.2 seed set: 6 more units (graphing errors, ratio or fraction, the equals sign, simplifying, I do we do you do, transitions; 28 in all) and 8 more misconceptions (12 in all). All `reviewedBy: null`, CK codes `AC9-TODO` / `NSW-TODO`.
- Lesson plans show at most 2 misconceptions, so a 60-minute plan still prints on 2 pages.
- `npm run content:export-review` writes `review/allegro-content-review.docx` and a `.md` copy (TECH_SPEC 10.3): how to review, a summary table, one page per unit (hook, core idea, worked example, check questions with answers and feedback, linked misconceptions, try tomorrow, reflection prompt), then the misconception bank and the diagnostic items. Each has a box for AC v9 and NSW codes, notes and Approved (Y/N). Maths is written as it looks on paper.
- `npm run content:approve -- <unit-id> --by "Name" --on YYYY-MM-DD` for Craig: sets the review fields and the content hash, and adds a line to `docs/review-log.md`.

### M5: Leader preview, feedback and hardening (25 November 2026)

- /leader: preview for a fictional school (confidence by area, most-used units, out-of-field topics, suggested focus). No teacher names or reflections.
- Thumbs on the needs, week, unit, lesson and help screens, and the end-of-loop survey at /survey. `POST /api/feedback` stores anonymous answers (random session id, never a user id) with the student-name check on comments.
- /admin/feedback for admin accounts (`profiles.is_admin`): thumbs by screen, survey averages, comments, CSV download. Everyone else is sent home.
- `POST /api/account/delete`: checks the teacher's token, then deletes the account with the service role (every teacher table cascades) and their usage rows. Plain message if the service role key isn't set.
- Full /about-demo (SPEC 7.12): what the demo does and doesn't do, how AI is used, data, voice input, who to contact, delete my account, and "Clear demo data" for demo users.
- Offline message across the app; rate limits show a friendly message.
- `npm run content:report` with `--gate` (pilot gate) and `--hash`; a "Pilot gate" workflow on `main` that fails until every unit is reviewed and every code is filled in.
- `npm run security:dist` fails the build if an Anthropic key, Supabase secret key or service-role token is in `dist`; runs in CI.
- `docs/a11y-checklist.md` for the manual screen reader pass.
- Tests: account deletion, feedback summary and CSV, content report; Playwright for the About page, admin redirect, offline and 429.

### M4: Reflect, growth and Quick Help (25 November 2026)

- `POST /api/help` and `POST /api/reflect` on the fast model with `prompts/help.md` and `prompts/reflect.md`. Unit ids checked against the catalogue, answers capped at 120 words in code, student-name checks, em dashes removed.
- /help: question box, three example questions, short answer in a labelled AI block, "Try tomorrow", related unit link, "More detail".
- /reflect: what you tried (ticks from your latest lesson plus free text), how students went, what you'll keep or change, optional confidence per need. AI observation and a next unit; saves even if the AI is down.
- /growth: units done, minutes, lessons planned, next best step, confidence per topic as small charts with a table, reflections timeline. No badges or streaks.
- Signed in: reflections and confidence ratings save to Supabase. Checked on the live database that one user's reflection is not readable by another (RLS, in a rolled-back transaction).
- Tests: both endpoints, the word cap; Playwright for Quick Help, Reflect into Growth, and Reflect with the AI down, all with axe.

### M3: Lesson Builder (25 November 2026)

- `POST /api/lesson` (main model, 3,500 tokens) with `prompts/lesson.md`, given the topic's own units as reference. In code: the misconceptions block is always rebuilt from `misconceptions.json`, curriculum refs come from unit metadata (`AC9-TODO` / `NSW-TODO`), every other block is marked AI draft with a maths check, em dashes removed.
- `POST /api/lesson-block` (main model, 1,000 tokens) with `prompts/lesson-block.md`: redoes one block, keeps its id and type; the misconceptions block is restored from the bank without calling the model.
- /plan: topic, year level, length, class profile (general only, student-name check), last lesson, and the "Add to my lesson" moves. Tammy's ready-made lesson for the demo, AI for everything else. List of saved lessons.
- /plan/:lessonId: margin timings, AC v9 and NSW refs side by side, "Check the maths" banner and a tick per block, edit, reorder, redo one block with an optional instruction, "Why this works" notes, print or save as PDF, copy as text.
- `src/styles/print.css`: A4, 15mm margins, no app chrome. Signed-in lessons save to the `lessons` table.
- Tests: grounding rules, both endpoints with a fake model, timings; Playwright for the demo lesson, editing, reordering, redo changing only one block, the AI path, and a PDF check that a 60-minute lesson is 2 pages or fewer.

### M2: Explain this differently and saved weeks (25 November 2026)

- `POST /api/explain` on the fast model with `prompts/explain.md`. The prompt holds only that unit's title, hook, core idea and worked example. Student-name check on the optional note, rate limits and usage logging as for diagnose.
- "Explain this differently" on the core idea page: "More simply" or "With a different example", shown in a labelled AI block, with a plain message if the AI is unavailable.
- Signed-in teachers: the week, its order, unit progress and reflections save to Supabase (`pathway_items`, `unit_progress`) and load on another device. Demo mode is unchanged.
- Unit catalogue now comes from a generated import list so the Functions can read it too.
- Tests: explain endpoint (fast model, 400 tokens, only the requested unit in the prompt, errors), Playwright for the AI answer and the AI-down message.

### M2 (demo slice): Pathway and learning (25 November 2026)

- 22 draft micro-units covering all 17 catalogue tags (extra depth for Tammy's linear relationships, algebra errors, checking for understanding and proportional reasoning), 4 misconceptions and 12 modules. All `reviewedBy: null`, curriculum codes `AC9-TODO` / `NSW-TODO`.
- `shared/pathway.ts`: rules-based week plan. Needs in priority order, each "now" need gets a unit before any need gets a second, the weekly time budget is never exceeded, learning goes on non-teaching weekdays (all weekdays if there are none), weeks start Monday in Sydney.
- /pathway: "Before Monday" band with the next unit, ruled list with day, duration, "Why this?" and up/down reorder, a Draft notice, and the lesson step marked coming soon.
- /learn/:unitId: hook, core idea, worked example, common mistake, quick check with feedback, try tomorrow with "Add to my lesson", and an optional reflection with the student-name check. Progress bar and Draft badge.
- Unbuilt teacher screens (/plan, /reflect, /growth, /help) say what's coming and link back to the week.
- Tests: catalogue validation, time budget, teaching days, Sydney week start; Playwright for Tammy's week and a full unit, and the coming-soon screens, with axe.
- Not yet: `/api/pathway` AI reasons, "Explain this differently", saving the week and progress to Supabase.

### M1: Auth, intake and diagnosis, without accounts (24 November 2026)

- Supabase migrations 0001 and 0002 from TECH_SPEC 5, plus 0003 for the pilot email allow-list and its auth hook. Not yet run (needs the Supabase project).
- `POST /api/diagnose`: access cookie and session checks, student-name rejection, rate limits from `ai_calls` (in memory without Supabase), Zod validation with one retry, invented tags dropped, at most 3 "now" needs. `POST /api/access` for the demo access code.
- Diagnose prompt, 17 catalogue tags, 16 draft diagnostic items (all unreviewed), and Tammy, Sam and Priya with cached diagnoses.
- Screens: /demo (access gate, sign-in, demo teachers, own-situation link), /signin, /auth/callback, /start (voice input, examples, optional guided questions, student-name warning, clarifying questions, fallback when the AI is unavailable) and /needs (editable summary, wellbeing note, confidence and priority, remove and undo, add a topic, Check yourself with an honest calibration message).
- Voice input note on /about-demo and under the intake box.
- Tests: shared logic, the diagnose endpoint with a fake model, access tokens, prompt build; Playwright for Tammy's path to /needs, intake with mocked AI, fallback on invalid AI output, the student-name block, and axe on the new screens.

### M0: Foundations (24 November 2026)

- Components: AllegroMark (with loading sequence), Button and ButtonLink, Tag, Label and SectionRule, Highlight, MarginNote, RuledRow, StepSquares, MarginLayout, TabBar, Sidebar, AppShell, QuickHelpButton, AIBlock (with maths check), DraftBadge, MathText (Markdown plus KaTeX with MathML), SiteHeader, SiteFooter.
- Full landing page (SPEC 7.1), first version of About this demo, and a /styleguide route showing every token and component.
- Teacher route placeholders now sit in the app frame (sidebar on laptop, tabs and Ask button on phone).
- Favicon from the four-circle mark. AI disclosure line set to "Drafted by Allegro AI. Please check before using."
- Tests: component tests, extra contrast pairs, axe with zero violations on /, /styleguide, /about-demo and /pathway, hero and CTA above the fold at 375px, no white text on sage. Lighthouse accessibility on the landing page: 100.

### Phase 0: repo scaffold (24 November 2026)

- Scaffolded Vite, React 18, TypeScript, Tailwind, Pages Functions and test tooling with pinned versions.
- Added Allegro colour tokens (SPEC 10.1) with contrast and no-raw-hex tests.
- Added route placeholders for every screen in SPEC 6 and TECH_SPEC 9.1, a minimal landing page and `GET /api/health`.
- Added CI (check, build, e2e with axe), SPEC.md, TECH_SPEC.md, CLAUDE.md, design reference screens, build plan and spec issues list.

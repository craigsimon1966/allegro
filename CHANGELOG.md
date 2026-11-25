# Changelog

## Unreleased

### Content review document (25 November 2026)

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

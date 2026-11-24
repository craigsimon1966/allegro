# Changelog

## Unreleased

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

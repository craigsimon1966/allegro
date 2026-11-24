# Changelog

## Unreleased

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

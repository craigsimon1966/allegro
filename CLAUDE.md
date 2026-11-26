# Allegro demo: rules for Claude Code

Read SPEC.md and TECH_SPEC.md before any work. Build only the milestone you are asked for.
The build order and current status are in docs/PLAN.md. Known contradictions between the specs are in docs/spec-issues.md: check it before relying on a detail that appears in both.

## Non-negotiables

- Australian spelling in all UI copy and content (maths, organise, colour, personalise).
- No em dashes anywhere in UI copy or content. Use commas, full stops or parentheses.
- Never invent curriculum codes. Use AC9-TODO and NSW-TODO and list them in docs/curriculum-todo.md.
- Never invent URLs for external resources. Only use content/approved-sources.json.
- Never put ANTHROPIC_API_KEY or SUPABASE_SERVICE_ROLE_KEY in client code. All AI calls go through functions/api/*.
- No student personal data is collected or stored.
- Every content unit you draft has reviewedBy: null. Never set reviewedBy yourself.
- Colour tokens only from src/styles/tokens.css. Never white text on sage. (A unit test fails on raw hex elsewhere.)
- Exercise book style: no cards, no rounded corners beyond 2px, structure from ruled lines and the margin.
- design/ holds reference screens only. Match them, never copy their markup.

## Working method

- Small commits with clear messages. Record each change in its own file, `changelog.d/<topic>.md`, never by editing CHANGELOG.md (see changelog.d/README.md). Parallel PRs then never conflict.
- Run `npm run check` (typecheck, lint, unit tests) before saying a milestone is done.
- If a decision is not in SPEC.md or TECH_SPEC.md, choose the simplest option, note it in its own file, `decisions.d/<topic>.md` (not by editing docs/decisions.md), and tell me.

## Commands

- npm run dev (Vite on 5173 + Pages Functions via wrangler on 8788, /api proxied)
- npm run check (tsc, eslint, vitest)
- npm run e2e (Playwright, starts Vite itself)
- npm run build
- npm run content:report
- npm run content:export-review

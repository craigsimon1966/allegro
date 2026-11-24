# Allegro Learning: teacher demo

Allegro Learning ("All learn grow") is an AI-enabled professional learning platform for Australian teachers, starting with out-of-field and early career maths teachers in Years 7 to 9. This repo holds the demo that proves one loop: tell Allegro your situation, see what you need, do 5-minute learning that fits your week, turn it into tomorrow's lesson, and reflect afterwards.

- **Product and design spec:** [SPEC.md](SPEC.md)
- **Technical spec:** [TECH_SPEC.md](TECH_SPEC.md)
- **Build plan:** [docs/PLAN.md](docs/PLAN.md)
- **Open spec issues:** [docs/spec-issues.md](docs/spec-issues.md)
- **Design reference screens:** [design/](design/)
- **Rules for Claude Code:** [CLAUDE.md](CLAUDE.md)

## Stack

Vite, React 18, TypeScript, React Router, Tailwind CSS (Allegro tokens only), Radix UI, Lucide, KaTeX, Zustand, TanStack Query, Zod. Cloudflare Pages Functions proxy the Anthropic API. Supabase (Sydney region) for magic-link sign-in and Postgres with row-level security. Vitest, Testing Library, Playwright and axe for tests.

## Getting started

Needs Node 22 (see `.nvmrc`).

```sh
npm install
cp .env.example .env.local        # VITE_* values (public)
cp .dev.vars.example .dev.vars    # server secrets for wrangler, never committed
npm run dev                       # http://localhost:5173, /api proxied to wrangler on 8788
```

The app runs without any keys until M1: the landing page and route placeholders work, and `GET /api/health` responds.

## Scripts

| Command                                                                 | What it does                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                                                           | Vite plus Pages Functions locally                            |
| `npm run build`                                                         | Typecheck and production build to `dist/`                    |
| `npm run check`                                                         | Typecheck, lint, unit tests (run before every PR)            |
| `npm run e2e`                                                           | Playwright end-to-end tests with axe, phone and laptop sizes |
| `npm run content:validate` / `content:report` / `content:export-review` | Content pipeline (from M2)                                   |

## Repository layout

See TECH_SPEC section 4. In short: `src/` is the React app, `functions/` the Cloudflare Pages Functions, `shared/` code used by both, `content/` the static catalogue, `prompts/` the editable AI prompts, `supabase/` migrations, `design/` reference screens, `docs/` plans and checklists.

## Ground rules

Australian spelling, no em dashes in UI copy, never invent curriculum codes, no student data, colours from `src/styles/tokens.css` only. Full list in [CLAUDE.md](CLAUDE.md).

Owned by ZOMO Consulting Pty Ltd.

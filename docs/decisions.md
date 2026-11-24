# Decisions made during the build

Decisions not covered by SPEC.md or TECH_SPEC.md. Newest first.

| Date       | Decision                                                                     | Why                                                                                 |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 2026-11-24 | Used `ALLEGRO_DEMO_SPEC_1.md` as `SPEC.md`                                   | It is the newer copy (adds 10.9, removes leftover card wording). See spec-issues.md |
| 2026-11-24 | Wrangler 4 rather than 3                                                     | Wrangler 3 is out of support and warns on every run                                 |
| 2026-11-24 | `npm run dev` runs Vite with an `/api` proxy to `wrangler pages dev` on 8788 | Wrangler's `--proxy` mode is deprecated                                             |
| 2026-11-24 | `playwright-core` pinned through `overrides`                                 | Keeps `@axe-core/playwright` on the same Playwright version as the test runner      |
| 2026-11-24 | Tailwind default palette removed                                             | Only Allegro tokens can be used in class names                                      |

# Spec issues: contradictions and gaps

Found while setting up the repo on 24 November 2026. Each item says what the scaffold does for now. Nothing here has been silently decided: items marked **Craig to decide** need an answer before the milestone shown.

## Which demo spec is current

Two copies of the demo spec were uploaded: `ALLEGRO_DEMO_SPEC.md` and `ALLEGRO_DEMO_SPEC_1.md`. Both say "Version 0.1, 27 October 2026". `_1` is clearly the newer one:

- It adds section 10.9 (design reference screens in `design/`).
- It removes every remaining mention of cards ("persona cards", "summary card", "unit card", `--card` token), which the older copy still had even though its own section 10.3 says "No cards".

**Used:** `ALLEGRO_DEMO_SPEC_1.md`, saved as `SPEC.md`. Suggest bumping it to version 0.2 so the two can't be confused again.

## Contradictions between SPEC.md and TECH_SPEC.md

TECH_SPEC says SPEC wins on product behaviour and TECH_SPEC wins on implementation. Where that rule settles it, the scaffold follows it, but the docs should still be brought into line.

| #   | Topic                      | SPEC.md says                                                             | TECH_SPEC.md says                                                                     | Scaffold follows                                                                                               |
| --- | -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Folder layout              | `server/prompts/`, `functions/_lib/schemas.ts` and `catalogue.ts` (12.2) | `prompts/` at root, `shared/schemas.ts`, `shared/catalogue.ts` (4)                    | TECH_SPEC                                                                                                      |
| 2   | Lesson block endpoint      | `POST /api/lesson/block` (8.2)                                           | `POST /api/lesson-block` (7.2)                                                        | TECH_SPEC                                                                                                      |
| 3   | Env var names              | `SUPABASE_ANON_KEY` for the browser, single `RATE_LIMIT_PER_HOUR` (12.3) | `VITE_SUPABASE_*` for the browser, separate user (40) and demo (15) limits (8)        | TECH_SPEC                                                                                                      |
| 4   | Rate limiting key          | "per IP and per session" (8.7)                                           | per user id or demo session, counted in `ai_calls`; SPEC 13 also says no IP is stored | TECH_SPEC (no IPs). SPEC 8.7 should drop "per IP"                                                              |
| 5   | Reflections in M4          | M4 check: "reflections stay local" (15)                                  | reflections saved to Supabase when signed in (5.1, M4 prompt)                         | TECH_SPEC. SPEC probably means "stay private"; reword the check                                                |
| 6   | AI disclosure line         | "Drafted by Allegro AI. Please check before using." (10.8)               | "Drafted by Allegro AI. Check before using." (9.3)                                    | **Decided by Craig (24 Nov):** "Drafted by Allegro AI. Please check before using." TECH_SPEC 9.3 to be updated |
| 7   | Quick Help button position | "Ask a question" sits above the tab bar on phone (10.6)                  | `QuickHelpButton` fixed bottom-right (9.3)                                            | SPEC (it is a design rule)                                                                                     |
| 8   | Accessibility bar for M0   | "axe shows zero violations" (15)                                         | "no serious violations" (14, M0)                                                      | Stricter SPEC bar is the goal; CI currently fails on serious or critical only                                  |
| 9   | Repo location              | n/a                                                                      | `zomo/allegro-demo`, under the ZOMO GitHub org (1)                                    | **Decided by Craig (24 Nov):** move the repo to the ZOMO GitHub org. Craig does the transfer                   |
| 10  | Persona picker note        | "data stays in this browser in Phase 1" (7.2)                            | magic-link sign-in from the first pilot (6), decided in SPEC 2.4 D2                   | Copy should say persona data stays in the browser, signed-in data is saved in Australia                        |

## Gaps (things neither spec defines)

| #   | Gap                                                                                                                                                    | Needed by | Suggested default                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------- |
| G1  | **Brand source files** are not in the repo or project files (`Allegro Logo.svg`, etc.)                                                                 | M0        | Craig will upload them later (24 Nov). M0 uses the simple four-circle mark from the design screens until then |
| G2  | **Diagnostic item type**: TECH_SPEC adds `content/diagnostics.json` but SPEC 9.1 has no `DiagnosticItem` type or link to needs/tags                    | M1        | Reuse `CheckItem` plus `topicTag` and `reviewedBy`                                                            |
| G3  | **Review fields**: TECH_SPEC 10.3 uses `reviewedOn` and a content hash, SPEC 9.1 `MicroUnit` doesn't have them                                         | M2        | Added as optional `reviewedOn` and `reviewedHash` in `shared/types.ts`                                        |
| G4  | **Unit count**: SPEC 9.2 table totals 26 units; SPEC 16 says "about 30"                                                                                | M2        | Build the 26 in the table; tell Denise to expect 26                                                           |
| G5  | **Approved sources URLs**: SPEC 8.5 names the organisations but gives no URLs                                                                          | M2        | Craig supplies the exact URLs; Claude Code must not guess them                                                |
| G6  | **Persona "Start as me" without sign-in**: SPEC 7.2 shows "Start as me" as a sign-in form, so a teacher can't try their own situation without an email | M1        | Keep as specified; flag in pilot feedback                                                                     |
| G7  | **Allow-list table** (TECH_SPEC 6.3) is the default for decision 1 but isn't in migration 0001                                                         | M1        | Add `0003_allowed_emails.sql` plus the auth hook if Craig keeps the default                                   |
| G8  | **Access cookie vs demo mode**: TECH_SPEC 6.2 gates `/demo` and `/signin`, but doesn't say whether `/api/*` also checks the access cookie              | M1        | Functions also require the cookie when the gate is on, otherwise the gate can be bypassed with curl           |
| G9  | **`/styleguide` and `/signin`, `/auth/callback`, `/admin/feedback` routes** are only in TECH_SPEC, not SPEC 6                                          | n/a       | Included in the router; SPEC 6 should list them                                                               |
| G10 | **Week starts when?** Pathway scheduling needs a start date and a time zone (school terms, AEST/AEDT)                                                  | M2        | Week starts Monday in `Australia/Sydney`; terms ignored in v1                                                 |
| G11 | **Voice input privacy**: Web Speech API in Chrome sends audio to Google's servers. Not covered in SPEC 13 privacy section                              | M1        | Mention it on `/about-demo` and show a one-line note by the microphone button                                 |
| G12 | **Model names**: `claude-sonnet-5-5` / `claude-haiku-5-5` are valid today; TECH_SPEC says re-check at build time                                       | M1        | Keep as env vars, re-check at M1                                                                              |

## Small things to tidy in the specs

- SPEC 0 tells the reader to create `CLAUDE.md` with a one-line rule; TECH_SPEC 2 gives a fuller `CLAUDE.md`. The repo uses the TECH_SPEC version.
- SPEC section 10.9 sits after a horizontal rule that separates it from the rest of section 10.
- Dates: SPEC is dated 27 October but records decisions from 24 November. Worth a version bump.

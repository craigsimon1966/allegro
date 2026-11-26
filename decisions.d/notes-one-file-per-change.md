## 26 Nov 2026: changelog and decision notes, one file per change

Almost every merge conflict on 26 Nov was two PRs adding a line at the top of `CHANGELOG.md` or the end of `docs/decisions.md`. Each change now writes `changelog.d/<topic>.md` and, when it makes a decision, `decisions.d/<topic>.md`. `npm run notes:assemble` (scripts/assemble-notes.ts) folds them into the two files at release time, in its own PR. Fragments are named by topic, not PR number, so they can be written before the PR exists. The existing files stay as they are.

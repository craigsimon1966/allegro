# Decision notes, one file per change

So that PRs built in parallel never edit the same lines, a decision adds its own file here instead of editing `docs/decisions.md`.

- Name it after the branch's topic, for example `curriculum-codes.md`.
- Write it as a section that starts with `## <date>: <title>`, in the same style as the sections at the end of `docs/decisions.md`.
- Read `docs/decisions.md` and every file here together: both are the decision record.
- `npm run notes:assemble` appends these files to the end of `docs/decisions.md` (oldest file first) and deletes them. Run it when cutting a release, in its own PR.

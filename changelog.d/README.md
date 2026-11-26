# Changelog entries, one file per change

So that PRs built in parallel never edit the same lines, a change adds its own file here instead of editing `CHANGELOG.md`.

- Name it after the branch's topic, for example `check-for-accuracy.md` (no PR number needed, so it can be written before the PR exists).
- Write one or more Markdown bullets ("- ..."), in the same style as `CHANGELOG.md`.
- `npm run notes:assemble` moves every entry into the "Unreleased" section of `CHANGELOG.md` (newest file first) and deletes the files. Run it when cutting a release, in its own PR.

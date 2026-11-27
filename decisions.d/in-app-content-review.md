## 27 Nov 2026: in-app content review

Not covered by SPEC.md or TECH_SPEC.md (TECH_SPEC 10.3 describes the Word document this replaces). Simplest options chosen:

- **Reviews live in Supabase, content stays in the repo.** Edits are stored as field-by-field changes on top of the JSON files and applied in the browser at start-up (`src/lib/contentReview.ts`), so nothing needs a redeploy. The server's AI prompts (explain, help, lessons) still read the repo files, so reviewer edits reach them only once they are copied into `content/`. That copy step is a follow-up script, run by Craig, like `content:approve`.
- **Approval is tied to a content hash** (`shared/review.ts contentHash`). If the item is edited, or its file changes, it shows as "Changed since approval" with the Draft label until approved again.
- **Curriculum codes are not editable** in the app, because codes must come from the official lists. A reviewer flags the item and names the right code; a developer then changes it, and the tests check it is official.
- **Parallel questions and wrong-answer feedback are shown but not editable** in this first version, to keep the edit screen short on a phone. Reviewers comment or flag to change them.
- **Roles:** the reviewer role is granted by email (`reviewers` table) so it can be given before the person first signs in; the admin (`profiles.is_admin`) can always review. All writes go through security definer functions that check the role.
- **Where to start:** the queue's first-visit filter uses the year levels and state the pilot teachers chose, as counts only (`pilot_years()`), leaving out reviewers and the admin. Until a pilot teacher has finished set-up, the queue shows all years.
- The Word export and import scripts stay for now, as a fallback.

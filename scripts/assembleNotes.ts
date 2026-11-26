// Folds changelog.d/*.md and decisions.d/*.md into CHANGELOG.md and docs/decisions.md.
// Pure functions here; scripts/assemble-notes.ts does the file work.

export interface Fragment {
  name: string;
  /** Last commit time, or file time: orders the fragments. */
  at: number;
  text: string;
}

const byTime = (a: Fragment, b: Fragment) => a.at - b.at || a.name.localeCompare(b.name);

/** Puts changelog fragments at the top of "## Unreleased", newest first. */
export function addToChangelog(changelog: string, fragments: Fragment[]): string {
  if (!fragments.length) return changelog;
  const lines = [...fragments]
    .sort(byTime)
    .reverse()
    .map((f) => f.text.trim())
    .join('\n');
  const marker = '## Unreleased\n\n';
  const at = changelog.indexOf(marker);
  if (at < 0) throw new Error('CHANGELOG.md has no "## Unreleased" section');
  const cut = at + marker.length;
  return `${changelog.slice(0, cut)}${lines}\n${changelog.slice(cut)}`;
}

/** Appends decision fragments to the end of docs/decisions.md, oldest first. */
export function addToDecisions(decisions: string, fragments: Fragment[]): string {
  if (!fragments.length) return decisions;
  const sections = [...fragments].sort(byTime).map((f) => f.text.trim());
  return `${decisions.trimEnd()}\n\n${sections.join('\n\n')}\n`;
}

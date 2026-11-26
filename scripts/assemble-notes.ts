// npm run notes:assemble: moves changelog.d/ and decisions.d/ entries into CHANGELOG.md and
// docs/decisions.md, then deletes the fragments. Run when cutting a release, in its own PR.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { addToChangelog, addToDecisions, type Fragment } from './assembleNotes';

function fragments(dir: string): Fragment[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((name) => {
      const path = join(dir, name);
      let at = statSync(path).mtimeMs;
      try {
        const t = execFileSync('git', ['log', '-1', '--format=%ct', '--', path]).toString().trim();
        if (t) at = Number(t) * 1000;
      } catch {
        // Not committed yet: keep the file time.
      }
      return { name, at, text: readFileSync(path, 'utf8') };
    });
}

const log = fragments('changelog.d');
const dec = fragments('decisions.d');
writeFileSync('CHANGELOG.md', addToChangelog(readFileSync('CHANGELOG.md', 'utf8'), log));
writeFileSync('docs/decisions.md', addToDecisions(readFileSync('docs/decisions.md', 'utf8'), dec));
for (const f of log) rmSync(join('changelog.d', f.name));
for (const f of dec) rmSync(join('decisions.d', f.name));
console.log(`Moved ${log.length} changelog and ${dec.length} decision entries.`);

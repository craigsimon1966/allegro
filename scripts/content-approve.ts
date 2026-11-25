import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MicroUnit } from '../shared/types';
import { unitHash } from './contentReport';

// For Craig, after Denise approves a unit (TECH_SPEC 10.3 step 4). Claude Code never runs this.
// npm run content:approve -- <unit-id> [<unit-id> ...] --by "Denise Halliday" --on 2026-12-01
// Sets reviewedBy, reviewedOn and reviewedHash, and adds a line to docs/review-log.md.

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const by = flag('--by');
const on = flag('--on');
const ids = args.filter(
  (a, i) => !a.startsWith('--') && !['--by', '--on'].includes(args[i - 1] ?? ''),
);
if (!by || !on || !/^\d{4}-\d{2}-\d{2}$/.test(on) || !ids.length) {
  console.error(
    'Usage: npm run content:approve -- <unit-id> ... --by "Reviewer Name" --on YYYY-MM-DD',
  );
  process.exit(1);
}

const root = join(import.meta.dirname, '..');
const log = join(root, 'docs', 'review-log.md');
if (!existsSync(log))
  writeFileSync(
    log,
    '# Review log\n\n| Unit | Reviewer | Date | Content version |\n| --- | --- | --- | --- |\n',
  );

for (const id of ids) {
  const file = join(root, 'content', 'units', `${id}.json`);
  if (!existsSync(file)) {
    console.error(`No unit file for ${id}`);
    process.exitCode = 1;
    continue;
  }
  const unit = JSON.parse(readFileSync(file, 'utf8')) as MicroUnit;
  const hash = unitHash(unit);
  writeFileSync(
    file,
    JSON.stringify({ ...unit, reviewedBy: by, reviewedOn: on, reviewedHash: hash }, null, 2) + '\n',
  );
  appendFileSync(log, `| ${id} | ${by} | ${on} | ${hash} |\n`);
  console.log(`Approved ${id} (${hash})`);
}

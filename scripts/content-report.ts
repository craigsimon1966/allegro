import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MicroUnit } from '../shared/types';
import { contentReport, gatePasses, unitHash } from './contentReport';

// npm run content:report            prints the review status of every unit
// npm run content:report -- --gate  also exits 1 unless the pilot gate passes (TECH_SPEC 10.3)
// npm run content:report -- --hash  prints each unit's hash, to copy into reviewedHash

const dir = join(import.meta.dirname, '..', 'content', 'units');
const units = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as MicroUnit);

if (process.argv.includes('--hash')) {
  for (const u of units) console.log(`${u.id}\t${unitHash(u)}`);
  process.exit(0);
}

const r = contentReport(units);
console.log(`Units: ${r.total}`);
console.log(`Unreviewed: ${r.unreviewed.length}`);
for (const id of r.unreviewed) console.log(`  ${id}`);
console.log(`Changed since review: ${r.changedSinceReview.length}`);
for (const id of r.changedSinceReview) console.log(`  ${id}`);
console.log(`Units with TODO curriculum codes: ${r.todoCodes.length}`);
for (const t of r.todoCodes) console.log(`  ${t.id} (AC9 ${t.ac9}, NSW ${t.nsw})`);
const pass = gatePasses(r);
console.log(pass ? 'Pilot gate: PASS' : 'Pilot gate: NOT YET');
if (process.argv.includes('--gate') && !pass) process.exit(1);

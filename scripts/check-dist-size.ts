import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// First-load budget for the landing page and demo picker. Run after `npm run build`.
// Teachers open Allegro on school wifi and phones, so the entry script stays small and the
// Supabase client (sign-in, saving) loads only when a screen needs it.

const BUDGET_KB = 110;
const dist = join(import.meta.dirname, '..', 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const entry = html.match(/<script[^>]+src="\/(assets\/[^"]+\.js)"/)?.[1];
if (!entry) {
  console.error('No entry script found in dist/index.html');
  process.exit(1);
}
const code = readFileSync(join(dist, entry));
const kb = gzipSync(code).length / 1024;
const problems: string[] = [];
if (kb > BUDGET_KB)
  problems.push(`Entry script is ${kb.toFixed(1)} KB gzipped, over the ${BUDGET_KB} KB budget.`);
if (code.includes('GoTrueClient'))
  problems.push('The Supabase client is in the entry script. Import it lazily (see main.tsx).');
if (problems.length) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log(`Entry script ${entry}: ${kb.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB).`);

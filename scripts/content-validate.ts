// npm run content:validate (TECH_SPEC 10). Exits 1 and lists every problem it finds.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateContent } from './contentValidate';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>;
const dir = 'content/units';
const units = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f, read(join(dir, f))]),
);
const problems = validateContent({
  units,
  tags: read('content/tags.json').tags as { id: string }[],
  misconceptions: read('content/misconceptions.json').misconceptions as never,
  modules: read('content/modules.json').modules as never,
  diagnostics: read('content/diagnostics.json').items as never,
});
if (problems.length) {
  console.error(
    `${problems.length} content problem(s):\n${problems.map((p) => `- ${p}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(`Content OK: ${Object.keys(units).length} units, no problems found.`);

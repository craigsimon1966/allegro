import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { MISCONCEPTIONS, UNITS } from '../shared/catalogue';
import diagnosticsFile from '../content/diagnostics.json';
import { parseReview, type ReviewedItem } from './reviewImport';

// npm run content:import-review -- path/to/marked-up.docx
// Reads Denise's marked-up review document and writes review/review-summary.md: for each item,
// Approved Y/N, her notes, codes, comments, and whether she made tracked changes.
// It changes no content. Tracked changes are copied in by hand (or by Claude Code on request),
// then Craig records approvals with the content:approve command it prints.

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run content:import-review -- path/to/marked-up.docx');
  process.exit(1);
}
const zip = unzipSync(new Uint8Array(readFileSync(file)));
const part = (name: string) => (zip[name] ? strFromU8(zip[name]!) : undefined);
const documentXml = part('word/document.xml');
if (!documentXml) {
  console.error(`${file} doesn't look like a Word document.`);
  process.exit(1);
}

const items = parseReview(documentXml, part('word/comments.xml'), {
  units: UNITS.map((u) => u.id),
  misconceptions: MISCONCEPTIONS.map((m) => m.id),
  diagnostics: (diagnosticsFile as { items: { id: string }[] }).items.map((d) => d.id),
});

const ready = items.filter((i) => i.kind === 'unit' && i.approved === 'Y' && !i.trackedChanges);
const needEdits = items.filter((i) => i.approved === 'Y' && i.trackedChanges);
const rejected = items.filter((i) => i.approved === 'N');
const blank = items.filter((i) => i.approved === null);
const codes = items.filter((i) => i.ac9 || i.nsw);

const row = (i: ReviewedItem) =>
  `| ${i.id} | ${i.approved ?? ''} | ${i.trackedChanges || ''} | ${[i.notes, ...i.comments].filter(Boolean).join(' / ').replace(/\|/g, '/')} |`;
const md = [
  '# Review summary',
  `From \`${file}\`, read ${new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}. Nothing in the content has been changed.`,
  [
    `- Units approved with no edits: ${ready.length}`,
    `- Items approved with tracked changes (copy the changes in first): ${needEdits.length}`,
    `- Not approved: ${rejected.length}`,
    `- Not marked yet: ${blank.length}`,
  ].join('\n'),
  '## All items',
  [
    '| Item | Approved | Tracked changes | Notes and comments |',
    '| --- | --- | --- | --- |',
    ...items.map(row),
  ].join('\n'),
  '## Curriculum codes she wrote',
  codes.length
    ? [
        '| Unit | AC v9 | NSW |',
        '| --- | --- | --- |',
        ...codes.map((c) => `| ${c.id} | ${c.ac9} | ${c.nsw} |`),
      ].join('\n')
    : 'None.',
  '## Next steps',
  ready.length
    ? `Record the approvals for units with no edits (check the reviewer name and date first):\n\n\`\`\`\nnpm run content:approve -- ${ready.map((r) => r.id).join(' ')} --by "Denise Halliday" --on YYYY-MM-DD\n\`\`\``
    : 'No units are ready to approve without edits.',
  needEdits.length
    ? `Copy in the tracked changes for ${needEdits.map((r) => r.id).join(', ')}, then approve them the same way.`
    : '',
  codes.length
    ? "Check each code on the ACARA or NSW Curriculum site, then put it in the unit's curriculumRefs and docs/curriculum-todo.md."
    : '',
]
  .filter(Boolean)
  .join('\n\n');

const out = join(import.meta.dirname, '..', 'review');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'review-summary.md'), md + '\n');
console.log(
  `${items.length} items: ${ready.length} approved with no edits, ${needEdits.length} approved with edits, ${rejected.length} not approved, ${blank.length} not marked. Wrote review/review-summary.md`,
);

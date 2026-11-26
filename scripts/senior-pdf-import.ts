// Reads senior general maths syllabuses that can only be downloaded by hand (their sites block
// automated downloads), and writes content/curriculum/senior-maths-pdf.json.
//   QCAA General Mathematics 2025 (Queensland)
//   SCSA Mathematics Applications ATAR, Year 11 (from 2026) and Year 12 (from 2027) (WA)
//   BSSS Mathematical Applications T (ACT)
// Run with: npx tsx scripts/senior-pdf-import.ts <pdf> [<pdf> ...]   (needs pdftotext)
// Each document is recognised by its own title. Entries use the document's own numbering, since
// none of these syllabuses has outcome codes. Nothing here is typed by hand.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface SeniorOutcome {
  code: string;
  states: string[];
  course: string;
  years: string[];
  text: string;
}

const tidy = (s: string) => s.replace(/\s+/g, ' ').replace(/[’]/g, "'").trim();
const yearOfUnit = (unit: number) => (unit <= 2 ? '11' : '12');

/** "Unit N" headings followed by "Topic N: Title" headings (QCAA and BSSS layouts). */
function unitTopics(text: string, prefix: string, states: string[], course: string) {
  const out: SeniorOutcome[] = [];
  let unit = 0;
  for (const line of text.split('\n')) {
    const u = /^\s*Unit ([1-4])[ab]?:/.exec(line);
    if (u) unit = Number(u[1]);
    const t = /^\s*Topic ([1-9]): (.+?)\s*$/.exec(line);
    if (!t || !unit || /\.{5,}/.test(line)) continue;
    const code = `${prefix} Unit ${unit} Topic ${t[1]}`;
    if (out.some((o) => o.code === code)) continue;
    out.push({ code, states, course, years: [yearOfUnit(unit)], text: tidy(t[2]!) });
  }
  return out;
}

/** "Topic 1.1: Title (20 hours)" headings (SCSA layout). */
function scsaTopics(text: string) {
  const out: SeniorOutcome[] = [];
  for (const m of text.matchAll(/^\s*Topic ([1-4])\.(\d+): (.+?)(?:\s*\(\d+ hours\))?\s*$/gm)) {
    const unit = Number(m[1]);
    const code = `SCSA Topic ${m[1]}.${m[2]}`;
    if (out.some((o) => o.code === code)) continue;
    out.push({
      code,
      states: ['WA'],
      course: 'SCSA Mathematics Applications ATAR',
      years: [yearOfUnit(unit)],
      text: `${tidy(m[3]!)} (Unit ${unit})`,
    });
  }
  return out;
}

const all: SeniorOutcome[] = [];
for (const file of process.argv.slice(2)) {
  const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  const head = tidy(text.slice(0, 3000));
  let found: SeniorOutcome[];
  if (/General Mathematics 2025/.test(head))
    found = unitTopics(text, 'QCAA', ['QLD'], 'QCAA General Mathematics');
  else if (/MATHEMATICS APPLICATIONS ATAR course/i.test(head)) found = scsaTopics(text);
  else if (/Mathematical Applications T/.test(head))
    found = unitTopics(text, 'BSSS', ['ACT'], 'BSSS Mathematical Applications');
  else throw new Error(`Not a known syllabus: ${file}`);
  if (found.length < 6) throw new Error(`Too few topics in ${file}: ${found.length}`);
  all.push(...found);
}
writeFileSync(
  join(process.cwd(), 'content', 'curriculum', 'senior-maths-pdf.json'),
  JSON.stringify(all, null, 2) + '\n',
);
console.log(`Senior (from PDFs): ${all.length} topics.`);

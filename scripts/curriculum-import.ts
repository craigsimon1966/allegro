// Downloads the official maths curriculum lists that Allegro validates codes against.
//   AC v9: ACARA's curriculum API, one file per year (Foundation to Year 10).
//   NSW:   the NESA Mathematics K-10 (2022) syllabus page, which embeds every outcome.
// Writes content/curriculum/ac9-maths.json and content/curriculum/nsw-maths.json.
// Run with: NODE_USE_ENV_PROXY=1 npx tsx scripts/curriculum-import.ts
// Nothing here is typed by hand: every code and its wording comes from the official source.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'content', 'curriculum');
const ACARA = 'https://www.australiancurriculum.edu.au/conf/acara/api/spa/ac/curriculum.';
const NESA =
  'https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-k-10-2022/content/stage-4';
const YEARS = ['F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// MathML (NESA) and LaTeX (ACARA) to plain text, enough for short outcome wording.
const plainMaths = (s: string) =>
  s
    .replace(/<mfrac>\s*<(m\w+)>(.*?)<\/\1>\s*<(m\w+)>(.*?)<\/\3>\s*<\/mfrac>/g, '$2/$4')
    .replace(/<msup>\s*<mrow>(.*?)<\/mrow>\s*<mrow>(.*?)<\/mrow>\s*<\/msup>/g, '$1^$2')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\frac(\d)\{([^}]*)\}/g, '$1/$2')
    .replace(/\\frac(\d)(\d)/g, '$1/$2')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷');

const clean = (s: string) =>
  plainMaths(s)
    .replace(/\\\((.*?)\\\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

interface AcaraDescription {
  code: string;
  title: string;
  location: { strand: string };
}

async function ac9() {
  const out: { code: string; year: string; strand: string; text: string }[] = [];
  for (const year of YEARS) {
    const file = year === 'F' ? 'MATMATFY' : `MATMATY${year}`;
    const res = await fetch(`${ACARA}${file}.json`);
    if (!res.ok) throw new Error(`ACARA ${file}: ${res.status}`);
    const data = (await res.json()) as { 'content-description': Record<string, AcaraDescription> };
    for (const d of Object.values(data['content-description'])) {
      out.push({ code: d.code, year, strand: d.location.strand, text: clean(d.title) });
    }
  }
  out.sort((a, b) => YEARS.indexOf(a.year) - YEARS.indexOf(b.year) || a.code.localeCompare(b.code));
  return out;
}

// NSW stages and the school years each one covers.
const STAGES: Record<string, { stage: string; years: string[] }> = {
  MAE: { stage: 'Early Stage 1', years: ['F'] },
  MA1: { stage: 'Stage 1', years: ['1', '2'] },
  MA2: { stage: 'Stage 2', years: ['3', '4'] },
  MA3: { stage: 'Stage 3', years: ['5', '6'] },
  MA4: { stage: 'Stage 4', years: ['7', '8'] },
  MA5: { stage: 'Stage 5', years: ['9', '10'] },
};

async function nsw() {
  const res = await fetch(NESA);
  if (!res.ok) throw new Error(`NESA: ${res.status}`);
  const html = await res.text();
  const re =
    /"code":\{"name":"[^"]*","type":"text","value":"(MA[E1-5]-[A-Z0-9-]+)"\},"description":\{[^}]*?"value":"((?:[^"\\]|\\.)*)"/g;
  // A few outcomes hold their wording in an embedded maths component, linked by codename.
  const component = (codename: string) => {
    const m = new RegExp(
      `"content":\\{"name":"[^"]*","type":"custom","value":"((?:[^"\\\\]|\\\\.)*)"\\}\\},"system":\\{"codename":"${codename}"`,
    ).exec(html);
    return m ? (JSON.parse(`"${m[1]}"`) as string) : '';
  };
  const linked =
    /"value":"(MA[E1-5]-[A-Z0-9-]+)"\},"description":\{"images":\[\],"linkedItemCodenames":\["([a-z0-9_]+)"\]/g;
  const fromComponent = new Map<string, string>();
  for (const m of html.matchAll(linked)) fromComponent.set(m[1]!, component(m[2]!));
  const seen = new Map<string, { code: string; stage: string; years: string[]; text: string }>();
  for (const m of html.matchAll(re)) {
    const code = m[1]!;
    if (seen.has(code)) continue;
    let text = clean(JSON.parse(`"${m[2]}"`) as string);
    if (!text) text = clean(fromComponent.get(code) ?? '');
    if (!text) throw new Error(`NESA: no wording found for ${code}`);
    const s = STAGES[code.slice(0, 3)]!;
    seen.set(code, { code, stage: s.stage, years: s.years, text });
  }
  return [...seen.values()].sort((a, b) => a.code.localeCompare(b.code));
}

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const a = await ac9();
  const n = await nsw();
  const odd = a.find((d) => !d.text || d.text.includes('\\'));
  if (odd) throw new Error(`AC v9: unconverted maths in ${odd.code}: ${odd.text}`);
  if (a.length < 200 || n.length < 100)
    throw new Error(`Too few codes: AC9 ${a.length}, NSW ${n.length}`);
  writeFileSync(join(OUT, 'ac9-maths.json'), JSON.stringify(a, null, 2) + '\n');
  writeFileSync(join(OUT, 'nsw-maths.json'), JSON.stringify(n, null, 2) + '\n');
  console.log(`AC v9: ${a.length} content descriptions. NSW: ${n.length} outcomes.`);
};

void main();

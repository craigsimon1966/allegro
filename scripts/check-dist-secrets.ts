import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// TECH_SPEC 11 security check: no secrets in the built site. Run after `npm run build`.
// Looks for Anthropic keys, Supabase secret keys and any service-role JWT.

const root = join(import.meta.dirname, '..', 'dist');
const PATTERNS: [string, RegExp][] = [
  ['Anthropic key', /sk-ant-[A-Za-z0-9_-]{8,}/],
  ['Supabase secret key', /sb_secret_[A-Za-z0-9_-]{8,}/],
  ['Environment variable name', /SUPABASE_SERVICE_ROLE_KEY|ANTHROPIC_API_KEY/],
];

function* files(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* files(p);
    else yield p;
  }
}

const jwtRole = (token: string) => {
  try {
    const payload = token.split('.')[1] ?? '';
    return (JSON.parse(Buffer.from(payload, 'base64url').toString()) as { role?: string }).role;
  } catch {
    return undefined;
  }
};

let found = 0;
for (const f of files(root)) {
  if (!/\.(js|html|css|json|map|txt)$/.test(f)) continue;
  const text = readFileSync(f, 'utf8');
  for (const [name, re] of PATTERNS)
    if (re.test(text)) {
      console.error(`${name} found in ${f}`);
      found++;
    }
  for (const m of text.matchAll(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g))
    if (jwtRole(m[0]) === 'service_role') {
      console.error(`Service role JWT found in ${f}`);
      found++;
    }
}
if (found) process.exit(1);
console.log('No secrets found in dist.');

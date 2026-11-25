import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APPROVED_SOURCES, sourcesFor } from '@shared/sources';

// CLAUDE.md: never invent URLs for external resources; only content/approved-sources.json.
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const ALLOWED_HOSTS = [
  // App infrastructure and attribution, not teacher-facing resources.
  'supabase.co',
  'claude.com',
  'anthropic.com',
  'www.w3.org',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

describe('external links', () => {
  it('every teacher-facing URL in the app and content is an approved source', () => {
    const approved = new Set(APPROVED_SOURCES.map((s) => s.url));
    const files = [...walk('src'), ...walk('shared'), ...walk('content')].filter(
      (f) => /\.(tsx?|json|md)$/.test(f) && !f.endsWith('approved-sources.json'),
    );
    const offenders: string[] = [];
    for (const f of files)
      for (const m of readFileSync(f, 'utf8').matchAll(/https?:\/\/[^\s"'`)<>\]]+/g)) {
        const url = m[0];
        const host = new URL(url).hostname;
        if (approved.has(url) || ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)))
          continue;
        offenders.push(`${f}: ${url}`);
      }
    expect(offenders).toEqual([]);
  });

  it('every approved source is https and has a summary', () => {
    for (const s of APPROVED_SOURCES) {
      expect(s.url.startsWith('https://')).toBe(true);
      expect(s.summary.length).toBeGreaterThan(10);
      expect(s.summary).not.toMatch(/—/);
    }
  });

  it('primary teachers do not see the 7 to 10 syllabus page', () => {
    expect(sourcesFor(['1']).map((s) => s.id)).not.toContain('nsw-doe-7-10');
    expect(sourcesFor(['8']).map((s) => s.id)).toContain('nsw-doe-7-10');
    expect(sourcesFor(['F']).length).toBe(APPROVED_SOURCES.length - 1);
  });
});

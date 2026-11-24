import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// TECH_SPEC 9.2: no raw hex colours outside src/styles/tokens.css.
const HEX = /#[0-9a-fA-F]{3,8}\b/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe('colour tokens', () => {
  it('only tokens.css contains raw hex colours', () => {
    const offenders = walk('src')
      .filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('tokens.css'))
      .filter((f) => HEX.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

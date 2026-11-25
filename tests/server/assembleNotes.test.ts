import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { addToChangelog, addToDecisions } from '../../scripts/assembleNotes';

describe('changelog and decision fragments', () => {
  it('puts changelog entries at the top of Unreleased, newest first', () => {
    const out = addToChangelog('# Changelog\n\n## Unreleased\n\n- old\n', [
      { name: 'a.md', at: 1, text: '- first\n' },
      { name: 'b.md', at: 2, text: '- second\n' },
    ]);
    expect(out).toBe('# Changelog\n\n## Unreleased\n\n- second\n- first\n- old\n');
  });

  it('appends decisions at the end, oldest first', () => {
    const out = addToDecisions('# Decisions\n\nold\n', [
      { name: 'b.md', at: 2, text: '## B\n' },
      { name: 'a.md', at: 1, text: '## A\n' },
    ]);
    expect(out).toBe('# Decisions\n\nold\n\n## A\n\n## B\n');
  });

  it('every fragment in the repo is in the right shape, with no em dashes', () => {
    for (const [dir, start] of [
      ['changelog.d', /^- /],
      ['decisions.d', /^## /],
    ] as const) {
      for (const f of readdirSync(dir).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
        const text = readFileSync(`${dir}/${f}`, 'utf8');
        expect(text, `${dir}/${f}`).toMatch(start);
        expect(text, `${dir}/${f}`).not.toContain('—');
      }
    }
  });
});

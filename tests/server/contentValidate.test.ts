// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { validateContent, type ContentInput } from '../../scripts/contentValidate';
import { UNITS, MISCONCEPTIONS, MODULES } from '../../shared/catalogue';
import { DIAGNOSTICS } from '../../shared/diagnostics';
import tagsFile from '../../content/tags.json';

const real = (): ContentInput => ({
  units: Object.fromEntries(UNITS.map((u) => [`${u.id}.json`, structuredClone(u)])),
  tags: tagsFile.tags,
  misconceptions: MISCONCEPTIONS.map((m) => ({ ...m })),
  modules: MODULES.map((m) => ({ ...m, unitIds: [...m.unitIds] })),
  diagnostics: DIAGNOSTICS.map((d) => ({ ...d })),
});

describe('content:validate', () => {
  it('passes on the current content (run by npm run check)', () => {
    expect(validateContent(real())).toEqual([]);
  });

  it('catches the mistakes a hand edit could make', () => {
    const c = real();
    const file = `${UNITS[0]!.id}.json`;
    const u = c.units[file] as Record<string, unknown>;
    u.durationMinutes = 12;
    u.tags = ['not.a.tag'];
    u.misconceptionIds = ['mis-nope'];
    u.hook = 'A hook — with an em dash';
    const problems = validateContent(c);
    expect(problems).toEqual(
      expect.arrayContaining([
        `${file}: durationMinutes 12 is outside 3 to 8`,
        `${file}: unknown tag not.a.tag`,
        `${file}: unknown misconception mis-nope`,
        `${file}: em dash in hook`,
      ]),
    );
  });

  it('reports a missing required field and a module pointing at a missing unit', () => {
    const c = real();
    const file = `${UNITS[0]!.id}.json`;
    delete (c.units[file] as Record<string, unknown>).tryTomorrow;
    c.modules[0]!.unitIds.push('ghost-unit');
    const problems = validateContent(c);
    expect(problems.some((p) => p.startsWith(`${file}: tryTomorrow`))).toBe(true);
    expect(problems.some((p) => p.includes('missing unit ghost-unit'))).toBe(true);
  });
});

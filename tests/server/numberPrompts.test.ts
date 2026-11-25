import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../../functions/_lib/prompts';

describe('AI prompts carry the number rules', () => {
  for (const name of ['lesson', 'lesson-block', 'explain', 'help'])
    it(name, () => {
      const vars = { REFERENCE: '', LESSON: '', STYLE: '', UNIT_TEXT: '', UNIT_LIST: '' };
      const p = buildPrompt(name, vars);
      expect(p).toContain('Never give two letters the same value');
      expect(p).toContain('Context or numbers only');
      expect(p).not.toContain('{{>');
    });
});

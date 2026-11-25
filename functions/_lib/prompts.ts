import { PROMPTS } from './prompts.generated';

/**
 * Loads prompts/<name>.md (compiled at build time), prefixed with the shared preamble.
 * `{{> _part}}` pulls in a shared part such as `_maths-examples.md` (number choice rules).
 */
export function buildPrompt(name: string, vars: Record<string, string> = {}): string {
  const body = PROMPTS[name];
  if (!body) throw new Error(`Unknown prompt: ${name}`);
  const withParts = body.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_m, part: string) => {
    const text = PROMPTS[part];
    if (text === undefined) throw new Error(`Prompt ${name} includes unknown part ${part}`);
    return text.trim();
  });
  const filled = withParts.replace(/\{\{([A-Z_]+)\}\}/g, (_m, key: string) => {
    const value = vars[key];
    if (value === undefined) throw new Error(`Prompt ${name} needs {{${key}}}`);
    return value;
  });
  return `${PROMPTS._preamble ?? ''}\n\n${filled}`.trim();
}

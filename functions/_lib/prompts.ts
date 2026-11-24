import { PROMPTS } from './prompts.generated';

/** Loads prompts/<name>.md (compiled at build time), prefixed with the shared preamble. */
export function buildPrompt(name: string, vars: Record<string, string> = {}): string {
  const body = PROMPTS[name];
  if (!body) throw new Error(`Unknown prompt: ${name}`);
  const filled = body.replace(/\{\{([A-Z_]+)\}\}/g, (_m, key: string) => {
    const value = vars[key];
    if (value === undefined) throw new Error(`Prompt ${name} needs {{${key}}}`);
    return value;
  });
  return `${PROMPTS._preamble ?? ''}\n\n${filled}`.trim();
}

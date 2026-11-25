import Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import type { Env } from './env';

// Model access for every endpoint (TECH_SPEC 7.1, 7.4). The `Completer` interface lets tests
// replace the real API with canned replies.

export interface Completion {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  /** 'max_tokens' when the reply was cut off at the limit. */
  stopReason?: string | null;
}

export interface CompleteArgs {
  model: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}

export type Completer = (args: CompleteArgs) => Promise<Completion>;

export class AiUnavailableError extends Error {}

/**
 * Thinking off for every call. Current models think by default, and thinking tokens count
 * towards max_tokens: in production a lesson spent all 8,000 tokens thinking and was cut off
 * before the JSON. Our replies are structured drafts grounded in reference text, and a person
 * checks the maths, so speed and a complete reply matter more here. Sonnet 5.5 turns thinking
 * off with 'between_tools'; Haiku 5.5 with 'disabled'. Other models keep their default.
 */
export function thinkingFor(model: string): Anthropic.ThinkingConfigParam | undefined {
  if (model.startsWith('claude-sonnet-5-5')) return { type: 'between_tools' };
  if (model.startsWith('claude-haiku-5-5')) return { type: 'disabled' };
  return undefined;
}

/**
 * Real Anthropic client. By default a 25 second timeout and one retry with backoff on timeouts
 * and 5xx. Long replies (a full lesson) take longer than 25 seconds to write, so their endpoints
 * pass a longer timeout and no retry: a retry after a timeout only doubles the wait.
 */
export function anthropicCompleter(
  env: Env,
  opts: { timeoutMs?: number; maxRetries?: number; fetch?: typeof fetch } = {},
): Completer {
  if (!env.ANTHROPIC_API_KEY) {
    return async () => {
      throw new AiUnavailableError('ANTHROPIC_API_KEY is not set');
    };
  }
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    timeout: opts.timeoutMs ?? 25_000,
    maxRetries: opts.maxRetries ?? 1,
    ...(opts.fetch ? { fetch: opts.fetch } : {}),
  });
  return async ({ model, system, messages, maxTokens }) => {
    try {
      const thinking = thinkingFor(model);
      const res = await client.messages.create({
        model,
        system,
        messages,
        max_tokens: maxTokens,
        ...(thinking ? { thinking } : {}),
      });
      const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
      return {
        text,
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
        stopReason: res.stop_reason,
      };
    } catch (e) {
      throw new AiUnavailableError(e instanceof Error ? e.message : 'Anthropic request failed');
    }
  };
}

/** Finds the first balanced JSON object in model text (it sometimes adds prose or fences). */
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON object found');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error('Unterminated JSON object');
}

export type JsonResult<T> =
  | { ok: true; data: T; usage: { input: number; output: number } }
  | {
      ok: false;
      code: 'ai_unavailable' | 'ai_invalid_output';
      usage: { input: number; output: number };
    };

/**
 * Asks for JSON, validates with Zod, and on failure asks once more with the validation errors
 * appended (TECH_SPEC 7.4). Returns ai_invalid_output if the second reply is still wrong.
 */
export async function generateJson<T>(
  complete: Completer,
  args: CompleteArgs,
  schema: z.ZodType<T>,
): Promise<JsonResult<T>> {
  const usage = { input: 0, output: 0 };
  let messages = args.messages;
  for (let attempt = 0; attempt < 2; attempt++) {
    let reply: Completion;
    try {
      reply = await complete({ ...args, messages });
    } catch {
      return { ok: false, code: 'ai_unavailable', usage };
    }
    usage.input += reply.inputTokens ?? 0;
    usage.output += reply.outputTokens ?? 0;
    // Cut off at the token limit: asking again would only be cut off again, at twice the wait.
    if (reply.stopReason === 'max_tokens') {
      const parsed = (() => {
        try {
          return schema.safeParse(extractJsonObject(reply.text));
        } catch {
          return null;
        }
      })();
      return parsed?.success
        ? { ok: true, data: parsed.data, usage }
        : { ok: false, code: 'ai_invalid_output', usage };
    }
    let problem: string;
    try {
      const parsed = schema.safeParse(extractJsonObject(reply.text));
      if (parsed.success) return { ok: true, data: parsed.data, usage };
      problem = parsed.error.issues
        .slice(0, 10)
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
    } catch (e) {
      problem = e instanceof Error ? e.message : 'Invalid JSON';
    }
    messages = [
      ...args.messages,
      { role: 'assistant', content: reply.text },
      {
        role: 'user',
        content: `Your last reply did not match the schema: ${problem}. Reply with corrected JSON only.`,
      },
    ];
  }
  return { ok: false, code: 'ai_invalid_output', usage };
}

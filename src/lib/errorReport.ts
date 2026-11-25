import { sendFeedback } from './api';

// Pilot error reporting. Crashes in a teacher's browser are sent to the anonymous feedback table
// (target "error"), which only admins can read on /admin/feedback. What is sent: the error
// message, the page path (no query string), the build and the first lines of the stack.
// Nothing a teacher typed is included.

const MAX_PER_PAGE_LOAD = 5;
const sent = new Set<string>();

const IGNORE = [/ResizeObserver loop/i, /^Script error\.?$/i, /Load failed/i, /Failed to fetch/i];

export function errorSummary(
  message: string,
  stack: string | undefined,
  path: string,
  build: string,
): string {
  const lines = (stack ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== message)
    .slice(0, 5);
  return [message.slice(0, 500), `Page: ${path}`, `Build: ${build}`, ...lines]
    .join('\n')
    .slice(0, 2000);
}

export function reportError(err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  const message = e.message || e.name || 'Unknown error';
  if (IGNORE.some((re) => re.test(message))) return;
  if (sent.has(message) || sent.size >= MAX_PER_PAGE_LOAD) return;
  sent.add(message);
  const build =
    document.querySelector('meta[name="allegro-build"]')?.getAttribute('content') ?? 'unknown';
  void sendFeedback({
    target: 'error',
    comment: errorSummary(message, e.stack, window.location.pathname, build),
  }).catch(() => undefined);
}

export function installErrorReporting(): void {
  window.addEventListener('error', (ev) => {
    // Errors from browser extensions or other origins carry no useful detail.
    if (ev.filename && !ev.filename.startsWith(window.location.origin)) return;
    reportError(ev.error ?? ev.message);
  });
  window.addEventListener('unhandledrejection', (ev) => reportError(ev.reason));
}

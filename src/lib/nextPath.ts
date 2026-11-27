// Where to go after signing in, so a reviewer who was sent to sign in lands back on /review.

const NEXT_KEY = 'allegro-next';

export function rememberNext(path: string) {
  try {
    sessionStorage.setItem(NEXT_KEY, path);
  } catch {
    // Private window: they can open /review again after signing in.
  }
}

/** Only internal review paths are honoured, never an outside address. */
export function takeNext(): string | null {
  try {
    const next = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return next && /^\/review(\/[\w.%-]*)*$/.test(next) ? next : null;
  } catch {
    return null;
  }
}

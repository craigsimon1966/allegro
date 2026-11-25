// Notices when a newer build has been deployed while this tab is open. A tab left open for
// hours otherwise keeps running the code it first loaded (version.txt comes from vite.config.ts).

const running =
  typeof document !== 'undefined'
    ? document.querySelector<HTMLMetaElement>('meta[name="allegro-build"]')?.content
    : undefined;

let stale = false;
let lastCheck = 0;

/** True once the live site is known to be a different build from the one running here. */
export const isStale = () => stale;

/** Asks the server which build is live, at most once a minute. */
export async function checkForUpdate(
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
  build = running,
): Promise<boolean> {
  // Local and test builds have no commit id, so there is nothing to compare.
  if (!build || !/^[0-9a-f]{7}$/.test(build) || stale || now - lastCheck < 60_000) return stale;
  lastCheck = now;
  try {
    const res = await fetchImpl('/version.txt', { cache: 'no-store' });
    if (!res.ok) return stale;
    const live = (await res.text()).trim().split(/\s+/)[0];
    if (live && /^[0-9a-f]{7,}$/.test(live) && live !== build) stale = true;
  } catch {
    // Offline or blocked: keep running what we have.
  }
  return stale;
}

/** For tests. */
export function resetFreshness() {
  stale = false;
  lastCheck = 0;
}

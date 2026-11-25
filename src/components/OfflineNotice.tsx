import { useSyncExternalStore } from 'react';

// Offline message (TECH_SPEC 14, M5). Demo data and anything already loaded keep working;
// only AI and saving need a connection.

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

export function OfflineNotice() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="no-print sticky top-0 z-50 border-b-2 border-rule-strong bg-highlighter px-4 py-2 text-center text-ink"
    >
      You're offline. What's on screen still works, but AI help and saving will wait until you're
      back online.
    </div>
  );
}

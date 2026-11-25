import { supabase } from './supabase';
import { useAppStore } from './store';

/**
 * Keeps a signed-in teacher signed in between visits. supabase-js keeps the session in
 * localStorage and refreshes it on its own; this puts the app back in signed-in mode when a
 * saved session is found, and back to anonymous if the session has gone.
 * Demo mode is left alone: a teacher who chose a persona keeps it until they sign in.
 */
export async function restoreSession(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  const { mode, setSignedIn, reset } = useAppStore.getState();
  if (data.session && mode === 'anonymous') setSignedIn();
  if (!data.session && mode === 'signed_in') reset();
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && useAppStore.getState().mode === 'signed_in')
      useAppStore.getState().reset();
  });
}

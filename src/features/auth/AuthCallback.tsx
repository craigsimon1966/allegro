import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AllegroMark } from '@/components/AllegroMark';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

/**
 * /auth/callback (TECH_SPEC 6.1). supabase-js exchanges the PKCE code from the URL on load;
 * then a new teacher goes to /start and a returning one to /pathway.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const setSignedIn = useAppStore((s) => s.setSignedIn);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setFailed(true);
      return;
    }
    const client = supabase;
    void (async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) await client.auth.exchangeCodeForSession(code).catch(() => undefined);
      const { data } = await client.auth.getSession();
      if (!data.session) {
        setFailed(true);
        return;
      }
      setSignedIn();
      const { count } = await client.from('intakes').select('id', { count: 'exact', head: true });
      navigate(count ? '/pathway' : '/start', { replace: true });
    })();
  }, [navigate, setSignedIn]);

  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
    >
      {failed ? (
        <>
          <h1 className="text-[26px]">That link didn&apos;t work</h1>
          <p className="max-w-prose">
            Sign-in links work once and expire after an hour. Please ask for a new one.
          </p>
          <Link to="/signin" className="font-bold text-green-700 underline">
            Get a new link
          </Link>
        </>
      ) : (
        <>
          <AllegroMark size={48} loading label="Signing you in" />
          <h1 className="text-[22px]">Signing you in</h1>
        </>
      )}
    </main>
  );
}

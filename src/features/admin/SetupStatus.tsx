import { useEffect, useState } from 'react';
import { SectionRule } from '@/components/Label';

// Reads GET /api/health so an admin can see whether the live setup is finished (TECH_SPEC 13).

interface Health {
  version: string;
  branch: string | null;
  contentVersion: string;
  aiCallsLast24h: number | null;
  setup: { anthropicKey: boolean; supabase: boolean; serviceRoleKey: boolean; accessCode: boolean };
  rateLimits: 'database' | 'memory';
}

const ROWS: { key: keyof Health['setup']; label: string; missing: string }[] = [
  { key: 'anthropicKey', label: 'Anthropic API key', missing: 'AI answers will fail.' },
  {
    key: 'supabase',
    label: 'Supabase URL and public key',
    missing: 'Sign-in and saving will fail.',
  },
  {
    key: 'serviceRoleKey',
    label: 'Supabase service role key',
    missing:
      'Rate limits only count per server copy, AI calls are not logged, and account deletion fails. Add it in Cloudflare as a secret.',
  },
  {
    key: 'accessCode',
    label: 'Demo access code',
    missing: 'Anyone with the link can use the demo. Optional.',
  },
];

export function SetupStatus() {
  const [h, setH] = useState<Health | null | undefined>(undefined);
  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<Health>) : null))
      .then(setH)
      .catch(() => setH(null));
  }, []);

  return (
    <section className="mt-8" aria-labelledby="setup-heading">
      <SectionRule id="setup-heading">Live setup</SectionRule>
      {h === undefined && <p className="mt-2 text-muted">Checking</p>}
      {h === null && (
        <p className="mt-2 text-muted">
          The health check didn&apos;t answer, so this can&apos;t be shown.
        </p>
      )}
      {h && (
        <>
          <p className="mt-2 text-[15px] text-muted">
            Version {h.version}
            {h.branch ? ` (${h.branch})` : ''} · {h.contentVersion} · AI calls in the last 24 hours:{' '}
            {h.aiCallsLast24h ?? 'not counted'}
          </p>
          <ul className="mt-2">
            {ROWS.map((r) => (
              <li key={r.key} className="border-b border-rule py-2">
                <span className="font-bold">{h.setup[r.key] ? 'Set' : 'Missing'}</span>: {r.label}
                {!h.setup[r.key] && <span className="block text-[15px]">{r.missing}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

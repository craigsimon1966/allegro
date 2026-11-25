import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MarginLayout } from '@/components/MarginLayout';
import { useAppStore } from '@/lib/store';
import QuickHelpPanel from './QuickHelpPanel';

// Quick Help as a page (SPEC 7.8). The same panel also opens as a slide-over from "Ask a question".
export default function Help() {
  const mode = useAppStore((s) => s.mode);
  if (mode === 'anonymous') return <Navigate to="/demo" replace />;
  return (
    <AppShell>
      <MarginLayout>
        <QuickHelpPanel />
        <p className="mt-6">
          <Link to="/pathway" className="text-green-700 underline">
            Back to this week
          </Link>
        </p>
      </MarginLayout>
    </AppShell>
  );
}

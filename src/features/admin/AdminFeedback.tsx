import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { MarginLayout } from '@/components/MarginLayout';
import { Label, SectionRule } from '@/components/Label';
import { Button } from '@/components/Button';
import { AllegroMark } from '@/components/AllegroMark';
import { useMode } from '@/lib/store';
import { loadFeedbackForAdmin } from '@/lib/api';
import { SURVEY_QUESTIONS } from '@/features/feedback/questions';
import { SetupStatus } from './SetupStatus';
import { surveyAverages, thumbsByTarget, toCsv, type FeedbackRow } from './feedbackSummary';

// /admin/feedback (SPEC 14, TECH_SPEC 9.1): signed in with profiles.is_admin, else home.

const KEYS = SURVEY_QUESTIONS.map((_, i) => `q${i + 1}`);

function download(rows: FeedbackRow[]) {
  const blob = new Blob([toCsv(rows, KEYS)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `allegro-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminFeedback() {
  const mode = useMode();
  const [rows, setRows] = useState<FeedbackRow[] | null | undefined>(undefined);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    if (mode !== 'signed_in') return;
    loadFeedbackForAdmin()
      .then(setRows)
      .catch((e: Error) => {
        setProblem(e.message);
        setRows([]);
      });
  }, [mode]);

  if (mode !== 'signed_in' || rows === null) return <Navigate to="/" replace />;
  if (rows === undefined)
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <AllegroMark size={48} loading label="Loading feedback" />
      </div>
    );

  const thumbs = thumbsByTarget(rows);
  const survey = surveyAverages(
    rows.filter((r) => r.target === 'survey'),
    KEYS,
  );
  const comments = rows.filter((r) => r.comment && r.target !== 'error');
  const errors = rows.filter((r) => r.target === 'error');

  return (
    <>
      <SiteHeader />
      <main id="main">
        <MarginLayout className="lg:mx-auto lg:max-w-[900px]">
          <Label>Admin</Label>
          <h1 className="mt-1 text-[30px] leading-tight">Pilot feedback</h1>
          <p className="mt-2 text-muted">{rows.length} responses, all anonymous. Newest first.</p>
          {problem && (
            <p role="alert" className="mt-3 font-bold text-error">
              {problem}
            </p>
          )}
          <Button className="mt-4" onClick={() => download(rows)} disabled={!rows.length}>
            Download CSV
          </Button>

          <SetupStatus />

          <section className="mt-8">
            <SectionRule>Thumbs by screen</SectionRule>
            <table className="mt-2 w-full text-left">
              <thead>
                <tr className="border-b-2 border-rule-strong">
                  <th scope="col" className="py-2">
                    Screen or unit
                  </th>
                  <th scope="col" className="py-2 text-right">
                    Helpful
                  </th>
                  <th scope="col" className="py-2 text-right">
                    Not helpful
                  </th>
                </tr>
              </thead>
              <tbody>
                {thumbs.map((t) => (
                  <tr key={t.target} className="border-b border-rule">
                    <td className="py-2">{t.target}</td>
                    <td className="py-2 text-right tabular-nums">{t.up}</td>
                    <td className="py-2 text-right tabular-nums">{t.down}</td>
                  </tr>
                ))}
                {!thumbs.length && (
                  <tr>
                    <td colSpan={3} className="py-2 text-muted">
                      No thumbs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="mt-8">
            <SectionRule>Survey (1 strongly disagree, 5 strongly agree)</SectionRule>
            <table className="mt-2 w-full text-left">
              <thead>
                <tr className="border-b-2 border-rule-strong">
                  <th scope="col" className="py-2">
                    Statement
                  </th>
                  <th scope="col" className="py-2 text-right">
                    Average
                  </th>
                  <th scope="col" className="py-2 text-right">
                    Answers
                  </th>
                </tr>
              </thead>
              <tbody>
                {survey.map((s, i) => (
                  <tr key={s.key} className="border-b border-rule">
                    <td className="py-2">{SURVEY_QUESTIONS[i]}</td>
                    <td className="py-2 text-right tabular-nums">
                      {s.mean === null ? 'None' : s.mean.toFixed(1)}
                    </td>
                    <td className="py-2 text-right tabular-nums">{s.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-8">
            <SectionRule>Comments</SectionRule>
            {!comments.length && <p className="mt-2 text-muted">No comments yet.</p>}
            <ul className="mt-2">
              {comments.map((c) => (
                <li key={c.id} className="border-b border-rule py-3">
                  <p className="text-sm text-muted">
                    {c.target}, {new Date(c.created_at).toLocaleString('en-AU')}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{c.comment}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="mt-8">
            <SectionRule>Errors in teachers&apos; browsers</SectionRule>
            {!errors.length && <p className="mt-2 text-muted">No errors reported.</p>}
            <ul className="mt-2">
              {errors.slice(0, 50).map((c) => (
                <li key={c.id} className="border-b border-rule py-3">
                  <p className="text-sm text-muted">
                    {new Date(c.created_at).toLocaleString('en-AU')}
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[13px]">
                    {c.comment}
                  </pre>
                </li>
              ))}
            </ul>
          </section>
        </MarginLayout>
      </main>
    </>
  );
}

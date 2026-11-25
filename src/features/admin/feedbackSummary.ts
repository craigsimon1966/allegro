// Pure helpers for /admin/feedback: summary counts and CSV export.

export interface FeedbackRow {
  id: number;
  session_id: string;
  target: string;
  thumbs: number | null;
  scores: Record<string, number> | null;
  comment: string | null;
  created_at: string;
}

export function thumbsByTarget(rows: FeedbackRow[]) {
  const out = new Map<string, { up: number; down: number }>();
  for (const r of rows) {
    if (r.thumbs !== 1 && r.thumbs !== -1) continue;
    const t = out.get(r.target) ?? { up: 0, down: 0 };
    if (r.thumbs === 1) t.up++;
    else t.down++;
    out.set(r.target, t);
  }
  return [...out.entries()]
    .map(([target, c]) => ({ target, ...c }))
    .sort((a, b) => b.up + b.down - (a.up + a.down) || a.target.localeCompare(b.target));
}

/** Mean score per survey question key (q1 to q5), with the number of answers. */
export function surveyAverages(rows: FeedbackRow[], keys: string[]) {
  return keys.map((k) => {
    const vals = rows.map((r) => r.scores?.[k]).filter((v): v is number => typeof v === 'number');
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    return { key: k, n: vals.length, mean };
  });
}

/** One CSV cell. Quotes when needed and stops spreadsheet formulas running. */
export function csvCell(v: unknown): string {
  let s =
    v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: FeedbackRow[], keys: string[]): string {
  const header = ['created_at', 'session_id', 'target', 'thumbs', ...keys, 'comment'];
  const lines = rows.map((r) =>
    [r.created_at, r.session_id, r.target, r.thumbs, ...keys.map((k) => r.scores?.[k]), r.comment]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\r\n') + '\r\n';
}

// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseReview, visibleText } from '../../scripts/reviewImport';

const p = (inner: string) => `<w:p><w:pPr/>${inner}</w:p>`;
const r = (t: string) => `<w:r><w:t xml:space="preserve">${t}</w:t></w:r>`;
const cell = (t: string) => `<w:tc><w:tcPr/>${p(r(t))}</w:tc>`;

const doc = [
  p(r('Summary')),
  p(r('unit-a  ·  Content knowledge')),
  p(
    r('Students ') +
      '<w:del w:id="1" w:author="D"><w:r><w:delText>often </w:delText></w:r></w:del>' +
      '<w:ins w:id="2" w:author="D"><w:r><w:t>usually </w:t></w:r></w:ins>' +
      '<w:commentRangeStart w:id="7"/>' +
      r('see it.'),
  ),
  cell('AC v9 content description codes: CODE-A'),
  cell('NSW Mathematics K-10 outcome codes:'),
  cell('Reviewer notes: Good &amp; clear'),
  cell('Approved (Y/N): Y   Reviewer and date: DH 1/12'),
  p(r('unit-b  ·  Pedagogical knowledge')),
  cell('Approved (Y/N): no   Reviewer and date:'),
  p(r('mis-x  (Linear)')),
  cell('Reviewer notes:'),
  cell('Approved (Y/N):'),
  p(r('dx-1. What is 2 + 2?')),
  cell('Notes: fine    Approved (Y/N): Y'),
].join('');
const comments =
  '<w:comments><w:comment w:id="7" w:author="Denise"><w:p><w:r><w:t>Say which year.</w:t></w:r></w:p></w:comment></w:comments>';

describe('reading the marked-up review document', () => {
  const items = parseReview(doc, comments, {
    units: ['unit-a', 'unit-b'],
    misconceptions: ['mis-x'],
    diagnostics: ['dx-1'],
  });
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  it('keeps insertions and drops deletions', () => {
    expect(visibleText(doc)).toContain('Students usually see it.');
  });
  it('reads approval, reviewer, codes, notes, tracked changes and comments per unit', () => {
    expect(byId['unit-a']).toMatchObject({
      approved: 'Y',
      reviewer: 'DH 1/12',
      ac9: 'CODE-A',
      nsw: '',
      notes: 'Good & clear',
      trackedChanges: 2,
      comments: ['Denise: Say which year.'],
    });
    expect(byId['unit-b']).toMatchObject({ approved: 'N', trackedChanges: 0 });
  });
  it('handles misconceptions left blank and one-line diagnostic boxes', () => {
    expect(byId['mis-x']).toMatchObject({ kind: 'misconception', approved: null });
    expect(byId['dx-1']).toMatchObject({ kind: 'diagnostic', approved: 'Y', notes: 'fine' });
  });
});

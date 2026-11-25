// Reads Denise's marked-up review document back (TECH_SPEC 10.3 step 3). Pure functions over
// the Word XML, so they can be unit tested without a .docx file.

export interface ReviewedItem {
  id: string;
  kind: 'unit' | 'misconception' | 'diagnostic';
  approved: 'Y' | 'N' | null;
  reviewer: string;
  ac9: string;
  nsw: string;
  notes: string;
  /** Tracked insertions and deletions in the item's own text (not its review box). */
  trackedChanges: number;
  comments: string[];
}

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** Visible text after tracked changes are accepted: insertions kept, deletions dropped. */
export function visibleText(xml: string): string {
  return decode(
    xml
      .replace(/<w:del\b[\s\S]*?<\/w:del>/g, '')
      .replace(/<w:tab\/>/g, ' ')
      .replace(/<\/w:p>/g, '\n')
      .match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>|\n/g)
      ?.map((t) => (t === '\n' ? '\n' : t.replace(/<[^>]+>/g, '')))
      .join('') ?? '',
  )
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

export function parseComments(commentsXml: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  if (!commentsXml) return out;
  for (const m of commentsXml.matchAll(/<w:comment\b([^>]*)>([\s\S]*?)<\/w:comment>/g)) {
    const id = /w:id="(\d+)"/.exec(m[1]!)?.[1];
    const author = /w:author="([^"]*)"/.exec(m[1]!)?.[1];
    if (id)
      out.set(
        id,
        `${author ? `${decode(author)}: ` : ''}${visibleText(m[2]!).replace(/\n/g, ' ')}`,
      );
  }
  return out;
}

const FIELD = {
  ac9: /^AC v9 content description codes:\s*/i,
  nsw: /^NSW Mathematics K-10 outcome codes:\s*/i,
  notes: /^(Reviewer notes|Notes):\s*/i,
  approved: /Approved \(Y\/N\):\s*/i,
};

function approvedFrom(text: string): 'Y' | 'N' | null {
  const after = text.split(FIELD.approved)[1] ?? '';
  const v = /^\s*(yes|no|y|n)\b/i.exec(after.split(/Reviewer and date:/i)[0] ?? '')?.[1];
  if (!v) return null;
  return v[0]!.toUpperCase() === 'Y' ? 'Y' : 'N';
}

export function parseReview(
  documentXml: string,
  commentsXml: string | undefined,
  ids: { units: string[]; misconceptions: string[]; diagnostics: string[] },
): ReviewedItem[] {
  const comments = parseComments(commentsXml);
  const items: ReviewedItem[] = [];
  let cur: ReviewedItem | null = null;
  const start = (id: string, kind: ReviewedItem['kind']) => {
    cur = {
      id,
      kind,
      approved: null,
      reviewer: '',
      ac9: '',
      nsw: '',
      notes: '',
      trackedChanges: 0,
      comments: [],
    };
    items.push(cur);
  };

  // Whole table cells (the review box rows) or single paragraphs, in document order.
  for (const m of documentXml.matchAll(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>|<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const xml = m[0];
    const text = visibleText(xml);
    const first = text.split('\n')[0] ?? '';

    const unitId = ids.units.find((id) => first.startsWith(`${id} `) || first === id);
    const misId = ids.misconceptions.find(
      (id) => first.startsWith(`${id} `) || first.startsWith(`${id}(`),
    );
    const dxId = ids.diagnostics.find(
      (id) => first.startsWith(`${id}.`) || first.startsWith(`${id}:`),
    );
    if (unitId) start(unitId, 'unit');
    else if (misId) start(misId, 'misconception');
    else if (dxId) start(dxId, 'diagnostic');
    const item = cur as ReviewedItem | null;
    if (!item) continue;

    for (const c of xml.matchAll(/<w:commentRangeStart w:id="(\d+)"/g)) {
      const body = comments.get(c[1]!);
      if (body) item.comments.push(body);
    }

    const isBox = /^<w:tc/.test(xml) && Object.values(FIELD).some((re) => re.test(first));
    if (!isBox) {
      item.trackedChanges += (xml.match(/<w:(ins|del)\b/g) ?? []).length;
      continue;
    }
    const value = (re: RegExp) => text.replace(re, '').replace(/\n/g, ' ').trim();
    if (FIELD.ac9.test(first)) item.ac9 = value(FIELD.ac9);
    else if (FIELD.nsw.test(first)) item.nsw = value(FIELD.nsw);
    else if (FIELD.notes.test(first)) {
      // Diagnostic boxes have notes and approval on one line.
      item.notes = value(FIELD.notes).split(FIELD.approved)[0]!.trim();
      if (FIELD.approved.test(text)) item.approved = approvedFrom(text);
    } else if (FIELD.approved.test(first)) {
      item.approved = approvedFrom(text);
      item.reviewer = (text.split(/Reviewer and date:/i)[1] ?? '').replace(/\n/g, ' ').trim();
    }
  }
  return items;
}

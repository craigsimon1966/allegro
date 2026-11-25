import file from '../content/approved-sources.json';

// Approved external sources (SPEC 7.5, 8.5). Links come only from content/approved-sources.json,
// which Craig approved. Never add a URL anywhere else.

export interface ApprovedSource {
  id: string;
  organisation: string;
  title: string;
  url: string;
  summary: string;
  audience: ('primary' | 'secondary')[];
}

export const APPROVED_SOURCES = file.sources as ApprovedSource[];

/** Sources for the teacher's year levels: primary for Foundation to Year 6, otherwise secondary. */
export function sourcesFor(yearLevels: string[]): ApprovedSource[] {
  const years = yearLevels.map((y) => (/^f/i.test(y) ? 0 : Number(y))).filter((n) => !isNaN(n));
  const primaryOnly = years.length > 0 && years.every((y) => y <= 6);
  const phase = primaryOnly ? 'primary' : 'secondary';
  return APPROVED_SOURCES.filter((s) => s.audience.includes(phase));
}

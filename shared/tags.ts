import tagsFile from '../content/tags.json';
import type { Domain } from './types';

export interface Tag {
  id: string;
  domain: Domain;
  label: string;
  yearLevels: string[];
}

export const TAGS: Tag[] = tagsFile.tags as Tag[];
export const TAG_IDS = new Set(TAGS.map((t) => t.id));
export const tagById = (id: string) => TAGS.find((t) => t.id === id);

/** Drops any tag the AI made up (TECH_SPEC 7.3). */
export function filterTags(tags: string[]): string[] {
  return [...new Set(tags.filter((t) => TAG_IDS.has(t)))];
}

/** Plain-language names for domains, matching the design screens. */
export const DOMAIN_LABELS: Record<Domain, string> = {
  CK: 'Content knowledge',
  PK: 'Pedagogy',
  PCK: 'Teaching this topic',
  ASSESSMENT: 'Assessment',
  WELLBEING: 'Wellbeing',
  CONTEXT: 'Your context',
};

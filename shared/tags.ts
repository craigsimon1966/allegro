import tagsFile from '../content/tags.json';
import type { Domain } from './types';

export interface Tag {
  id: string;
  domain: Domain;
  label: string;
  yearLevels: string[];
  /**
   * A lesson topic with no learning unit yet. It is offered in Plan a lesson, but a need can't
   * point to it (the week would have nothing to learn for it). Remove the flag when its unit lands.
   */
  lessonOnly?: boolean;
}

export const TAGS: Tag[] = tagsFile.tags as Tag[];
export const TAG_IDS = new Set(TAGS.map((t) => t.id));
export const tagById = (id: string) => TAGS.find((t) => t.id === id);

/** Topics a teacher's need can point to: every tag except lesson-only topics. */
export const NEED_TAGS = TAGS.filter((t) => !t.lessonOnly);
const NEED_TAG_IDS = new Set(NEED_TAGS.map((t) => t.id));

/** Drops any tag the AI made up (TECH_SPEC 7.3), and lesson-only topics, which have no units. */
export function filterTags(tags: string[]): string[] {
  return [...new Set(tags.filter((t) => NEED_TAG_IDS.has(t)))];
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

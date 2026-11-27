import type { MicroUnit, Misconception, Module } from './types';
import misconceptionsFile from '../content/misconceptions.json';
import modulesFile from '../content/modules.json';
import { UNIT_FILES } from './units.generated';

// Static content catalogue (TECH_SPEC 10). The unit list is generated from content/units.

export const UNITS: MicroUnit[] = [...UNIT_FILES].sort((a, b) => a.id.localeCompare(b.id));
export const MISCONCEPTIONS = misconceptionsFile.misconceptions as Misconception[];
export const MODULES = modulesFile.modules as Module[];

// The files as they are in the repo. In the browser, src/lib/contentReview.ts swaps entries in
// UNITS and MISCONCEPTIONS for reviewer-edited and approved versions; these copies never change.
export const BASE_UNITS: readonly MicroUnit[] = [...UNITS];
export const BASE_MISCONCEPTIONS: readonly Misconception[] = [...MISCONCEPTIONS];

export const unitById = (id: string) => UNITS.find((u) => u.id === id);
export const misconceptionById = (id: string) => MISCONCEPTIONS.find((m) => m.id === id);

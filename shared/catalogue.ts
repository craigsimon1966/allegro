/// <reference types="vite/client" />
import type { MicroUnit, Misconception, Module } from './types';
import misconceptionsFile from '../content/misconceptions.json';
import modulesFile from '../content/modules.json';

// Static content catalogue (TECH_SPEC 10). Every unit file in content/units is bundled.
const unitFiles = import.meta.glob<MicroUnit>('../content/units/*.json', {
  eager: true,
  import: 'default',
});

export const UNITS: MicroUnit[] = Object.values(unitFiles).sort((a, b) => a.id.localeCompare(b.id));
export const MISCONCEPTIONS = misconceptionsFile.misconceptions as Misconception[];
export const MODULES = modulesFile.modules as Module[];

export const unitById = (id: string) => UNITS.find((u) => u.id === id);
export const misconceptionById = (id: string) => MISCONCEPTIONS.find((m) => m.id === id);

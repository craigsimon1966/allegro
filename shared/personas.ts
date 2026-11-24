import personasFile from '../content/personas.json';
import { DiagnosisSchema, GuidedSchema, type Diagnosis, type Guided } from './schemas';

export interface Persona {
  id: string;
  name: string;
  initial: string;
  situation: string;
  situationText: string;
  guided: Guided;
  cachedDiagnosis: Diagnosis;
}

// Parsed with the real schemas so a broken persona file fails loudly in tests.
export const PERSONAS: Persona[] = personasFile.personas.map((p) => ({
  ...p,
  guided: GuidedSchema.parse(p.guided),
  cachedDiagnosis: DiagnosisSchema.parse(p.cachedDiagnosis),
}));

export const personaById = (id: string) => PERSONAS.find((p) => p.id === id);

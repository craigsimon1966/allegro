import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Diagnosis, Guided, Need } from '@shared/schemas';
import type { DiagnosticResult } from '@shared/diagnostics';

// App state (TECH_SPEC 3.1). Demo mode keeps everything here and in localStorage (SPEC 12.1).
// localStorage can be missing or throw (private windows, blocked storage), so every access is guarded.

const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* storage unavailable: state lives in memory only */
    }
  },
  removeItem: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export type Mode = 'demo' | 'signed_in' | 'anonymous';

export interface TeacherNeed extends Need {
  status: 'active' | 'removed';
  selfRating: number | null;
  diagnosticResult: DiagnosticResult | null;
}

export interface Intake {
  situationText: string;
  guided: Guided;
}

interface State {
  mode: Mode;
  personaId: string | null;
  demoSessionId: string | null;
  intake: Intake | null;
  summary: string;
  diagnosis: Diagnosis | null;
  needs: TeacherNeed[];
  startDemo: (personaId: string | null) => void;
  setSignedIn: () => void;
  setIntake: (intake: Intake) => void;
  setDiagnosis: (d: Diagnosis) => void;
  setSummary: (s: string) => void;
  updateNeed: (id: string, patch: Partial<TeacherNeed>) => void;
  addNeed: (need: TeacherNeed) => void;
  reset: () => void;
}

const newSessionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
      );

export const toTeacherNeeds = (d: Diagnosis): TeacherNeed[] =>
  d.needs.map((n) => ({ ...n, status: 'active', selfRating: null, diagnosticResult: null }));

const empty = { intake: null, summary: '', diagnosis: null, needs: [] as TeacherNeed[] };

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      mode: 'anonymous',
      personaId: null,
      demoSessionId: null,
      ...empty,
      startDemo: (personaId) =>
        set({ mode: 'demo', personaId, demoSessionId: newSessionId(), ...empty }),
      setSignedIn: () => set({ mode: 'signed_in', personaId: null }),
      setIntake: (intake) => set({ intake }),
      setDiagnosis: (d) => set({ diagnosis: d, summary: d.summary, needs: toTeacherNeeds(d) }),
      setSummary: (summary) => set({ summary }),
      updateNeed: (id, patch) =>
        set((s) => ({ needs: s.needs.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
      addNeed: (need) => set((s) => ({ needs: [...s.needs, need] })),
      reset: () => set({ mode: 'anonymous', personaId: null, demoSessionId: null, ...empty }),
    }),
    { name: 'allegro-demo', storage: createJSONStorage(() => safeStorage), version: 1 },
  ),
);

export const useMode = () => useAppStore((s) => s.mode);

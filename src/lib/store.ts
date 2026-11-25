import { create } from 'zustand';
import type { CheckAttempt } from '@shared/quickCheck';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Diagnosis, Guided, Need } from '@shared/schemas';
import type { DiagnosticResult } from '@shared/diagnostics';
import type { PathwayItem } from '@shared/pathway';
import type { Lesson, LessonPack } from '@shared/schemas';
import type { LessonRequest } from '@shared/lesson';

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

export interface ReadingPick {
  sourceId: string;
  reason: string;
}

export interface UnitProgress {
  completedAt: string | null;
  checkCorrect: number;
  reflection: string;
  /** Latest quick check attempt per item id, fed into needs (see shared/quickCheck.ts). */
  attempts?: Record<string, CheckAttempt>;
}

/** A "Try tomorrow" move saved for the lesson builder (M3). */
export interface LessonMove {
  unitId: string;
  text: string;
}

export interface SavedLesson {
  lesson: Lesson;
  inputs: LessonRequest;
  /** Block ids the teacher has ticked "I've checked this" on. */
  checked: string[];
  /** Supabase row id once saved (signed in only). */
  dbId?: string;
  /** The classroom pack, drafted for the lesson content with this key (shared/lessonPack.ts). */
  pack?: { key: string; pack: LessonPack };
  updatedAt: string;
}

export interface Reflection {
  id: string;
  at: string;
  lessonId: string | null;
  tried: string;
  happened: string;
  nextTime: string;
  ratings: Record<string, number>;
  observation: string | null;
  suggestedUnitId: string | null;
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
  pathway: PathwayItem[] | null;
  /** Needs signature the pathway was built from, so edited needs rebuild it. */
  pathwayKey: string;
  /** The AI's further reading picks for this week: approved source ids only, checked on the server. */
  pathwayReading: ReadingPick[];
  progress: Record<string, UnitProgress>;
  lessonMoves: LessonMove[];
  lessons: Record<string, SavedLesson>;
  reflections: Reflection[];
  startDemo: (personaId: string | null) => void;
  setSignedIn: () => void;
  setIntake: (intake: Intake) => void;
  setDiagnosis: (d: Diagnosis) => void;
  setSummary: (s: string) => void;
  updateNeed: (id: string, patch: Partial<TeacherNeed>) => void;
  addNeed: (need: TeacherNeed) => void;
  setPathway: (items: PathwayItem[], key: string, reading?: ReadingPick[]) => void;
  moveItem: (unitId: string, dir: -1 | 1) => void;
  /** Moves a unit to another day of the week (YYYY-MM-DD). Its place in the list stays. */
  setItemDay: (unitId: string, day: string) => void;
  saveProgress: (unitId: string, patch: Partial<UnitProgress>) => void;
  addLessonMove: (move: LessonMove) => void;
  putLesson: (saved: SavedLesson) => void;
  updateLesson: (id: string, fn: (l: SavedLesson) => SavedLesson) => void;
  addReflection: (r: Reflection) => void;
  updateReflection: (id: string, patch: Partial<Reflection>) => void;
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

const empty = {
  intake: null,
  summary: '',
  diagnosis: null,
  needs: [] as TeacherNeed[],
  pathway: null,
  pathwayKey: '',
  pathwayReading: [] as ReadingPick[],
  progress: {} as Record<string, UnitProgress>,
  lessonMoves: [] as LessonMove[],
  lessons: {} as Record<string, SavedLesson>,
  reflections: [] as Reflection[],
};

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
      setPathway: (pathway, pathwayKey, pathwayReading = []) =>
        set({ pathway, pathwayKey, pathwayReading }),
      moveItem: (unitId, dir) =>
        set((s) => {
          if (!s.pathway) return {};
          const items = [...s.pathway].sort((a, b) => a.sortOrder - b.sortOrder);
          const i = items.findIndex((it) => it.unitId === unitId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= items.length) return {};
          [items[i], items[j]] = [items[j]!, items[i]!];
          return { pathway: items.map((it, k) => ({ ...it, sortOrder: k })) };
        }),
      setItemDay: (unitId, day) =>
        set((s) => ({
          pathway:
            s.pathway?.map((it) => (it.unitId === unitId ? { ...it, scheduledFor: day } : it)) ??
            null,
        })),
      saveProgress: (unitId, patch) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [unitId]: {
              ...(s.progress[unitId] ?? { completedAt: null, checkCorrect: 0, reflection: '' }),
              ...patch,
            },
          },
        })),
      addLessonMove: (move) =>
        set((s) =>
          s.lessonMoves.some((m) => m.unitId === move.unitId)
            ? {}
            : { lessonMoves: [...s.lessonMoves, move] },
        ),
      putLesson: (saved) =>
        set((s) => ({ lessons: { ...s.lessons, [saved.lesson.lesson_id]: saved } })),
      updateLesson: (id, fn) =>
        set((s) => {
          const cur = s.lessons[id];
          if (!cur) return {};
          return {
            lessons: { ...s.lessons, [id]: { ...fn(cur), updatedAt: new Date().toISOString() } },
          };
        }),
      addReflection: (r) => set((s) => ({ reflections: [...s.reflections, r] })),
      updateReflection: (id, patch) =>
        set((s) => ({
          reflections: s.reflections.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      reset: () => set({ mode: 'anonymous', personaId: null, demoSessionId: null, ...empty }),
    }),
    { name: 'allegro-demo', storage: createJSONStorage(() => safeStorage), version: 1 },
  ),
);

export const useMode = () => useAppStore((s) => s.mode);

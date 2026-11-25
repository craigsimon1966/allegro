import { useMemo } from 'react';
import { teacherProfile, type TeacherProfile } from '@shared/profile';
import { useAppStore } from '@/lib/store';

/** The teacher's year levels, state, role and location: their own answers first, then the AI's reading. */
export function useTeacherProfile(): TeacherProfile {
  const guided = useAppStore((s) => s.intake?.guided);
  const diagnosis = useAppStore((s) => s.diagnosis);
  return useMemo(() => teacherProfile(guided, diagnosis), [guided, diagnosis]);
}

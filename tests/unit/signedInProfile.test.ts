import { beforeEach, describe, expect, it, vi } from 'vitest';
import personas from '../../content/personas.json' with { type: 'json' };
import type { Diagnosis } from '@shared/schemas';

// A tiny in-memory stand-in for the two tables a signed-in intake touches.
const tables: { intakes: Record<string, unknown>[]; needs: Record<string, unknown>[] } = {
  intakes: [],
  needs: [],
};
function from(name: string) {
  const rows = tables[name as keyof typeof tables];
  let picked = rows;
  const q = {
    insert(r: Record<string, unknown> | Record<string, unknown>[]) {
      const list = (Array.isArray(r) ? r : [r]).map((x, i) => ({
        id: `${name}-${rows.length + i}`,
        ...x,
      }));
      rows.push(...list);
      picked = list;
      return q;
    },
    select: () => q,
    eq: (k: string, v: unknown) => ((picked = picked.filter((x) => x[k] === v)), q),
    order: () => q,
    limit: () => q,
    single: async () => ({ data: picked[0], error: null }),
    maybeSingle: async () => ({ data: picked[picked.length - 1] ?? null, error: null }),
    then: (res: (v: unknown) => void) => res({ data: picked, error: null }),
  };
  return q;
}
vi.mock('@/lib/supabase', () => ({ supabase: { from } }));

const { saveIntakeAndNeeds, loadLatestFromSupabase } = await import('@/lib/api');
const { useAppStore } = await import('@/lib/store');
const { teacherProfile } = await import('@shared/profile');

const diagnosis = personas.personas[0]!.cachedDiagnosis as unknown as Diagnosis;

describe('a signed-in teacher signing in again', () => {
  beforeEach(() => {
    tables.intakes = [];
    tables.needs = [];
    useAppStore.getState().reset();
  });

  it('keeps their state, year levels, role, situations and days a week', async () => {
    useAppStore.getState().setSignedIn();
    const guided = {
      state: 'VIC' as const,
      yearLevels: ['11'],
      role: 'hod' as const,
      situations: ['new_to_leading'],
      teachingDaysPerWeek: 3,
    };
    await saveIntakeAndNeeds('Year 11 General Mathematics.', diagnosis, guided as never);
    useAppStore.getState().reset();
    useAppStore.getState().setSignedIn();

    expect(await loadLatestFromSupabase()).toBe(true);
    const { intake, diagnosis: d } = useAppStore.getState();
    const profile = teacherProfile(intake?.guided, d);
    expect(profile.state).toBe('VIC');
    expect(profile.years).toEqual(['11']);
    expect(profile.role).toBe('hod');
    expect(profile.daysPerWeek).toBe(3);
  });

  it('an intake saved before this change still loads', async () => {
    tables.intakes.push({ id: 'old', situation_text: 'Year 8', diagnosis });
    expect(await loadLatestFromSupabase()).toBe(true);
    expect(useAppStore.getState().intake?.guided).toEqual({});
  });
});

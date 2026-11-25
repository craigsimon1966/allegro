// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import type { Completer } from '../../functions/_lib/anthropic';
import { handlePathway, userMessage } from '../../functions/_lib/pathway';
import { resetMemoryLimits } from '../../functions/_lib/ratelimit';
import { UNITS, unitById } from '../../shared/catalogue';
import { buildPathway, totalMinutes, type PathwayItem } from '../../shared/pathway';
import { personaById } from '../../shared/personas';

const SESSION = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
const tammy = personaById('tammy')!;
const needs = tammy.cachedDiagnosis.needs.map((n) => ({
  id: n.id,
  topic: n.topic,
  evidence: n.evidence,
  priority: n.priority,
  catalogue_tags: n.catalogue_tags,
}));
const body = {
  needs,
  hoursPerWeek: 0.5,
  teachingDays: [1, 3, 4],
  weekStart: '2026-11-23',
  yearLevels: ['8'],
};
const post = (b: unknown) =>
  new Request('http://localhost/api/pathway', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-demo-session': SESSION },
    body: JSON.stringify(b),
  });
const reply =
  (o: unknown): Completer =>
  async () => ({ text: JSON.stringify(o) });
type Res = { items: PathwayItem[]; external: { sourceId: string }[]; source: string };

beforeEach(() => resetMemoryLimits());

describe('POST /api/pathway', () => {
  it("keeps the AI's real units and reasons, drops made-up ones, and stays inside the hours", async () => {
    const matching = UNITS.filter((u) => u.tags.some((t) => needs[0]!.catalogue_tags.includes(t)));
    const aiItems = [
      { unitId: 'made-up-unit', needId: needs[0]!.id, reason: 'Invented.' },
      ...matching.map((u) => ({
        unitId: u.id,
        needId: needs[0]!.id,
        reason: `You said this \u2014 ${u.id}.`,
      })),
    ];
    const res = await handlePathway(
      post(body),
      {},
      {
        complete: reply({
          items: aiItems,
          external: [
            { sourceId: 'resolve', reason: 'Good tasks.' },
            { sourceId: 'not-approved', reason: 'x' },
          ],
        }),
      },
    );
    const r = (await res.json()) as Res;
    expect(r.source).toBe('ai');
    expect(r.items.length).toBeGreaterThan(0);
    for (const it of r.items) expect(unitById(it.unitId)).toBeDefined();
    expect(r.items.some((it) => it.unitId === 'made-up-unit')).toBe(false);
    expect(totalMinutes(r.items, UNITS)).toBeLessThanOrEqual(30);
    expect(r.items[0]!.reason).not.toMatch(/—/);
    // Tammy teaches Mon, Wed and Thu, so learning goes on Tue and Fri.
    for (const it of r.items) expect(['2026-11-24', '2026-11-27']).toContain(it.scheduledFor);
    expect(r.external.map((e) => e.sourceId)).toEqual(['resolve']);
  });

  it("tells the AI the teacher's curriculum and drops NSW-only links outside NSW", async () => {
    const vic = { ...body, yearLevels: ['8'], state: 'VIC' };
    expect(userMessage(vic as Parameters<typeof userMessage>[0])).toContain('Victorian Curriculum');
    let prompt = '';
    const res = await handlePathway(
      post(vic),
      {},
      {
        complete: async (opts) => {
          prompt = JSON.stringify(opts);
          return {
            text: JSON.stringify({
              items: [],
              external: [
                { sourceId: 'nesa-maths-k10', reason: 'NSW syllabus.' },
                { sourceId: 'resolve', reason: 'Good tasks.' },
              ],
            }),
          };
        },
      },
    );
    const r = (await res.json()) as Res;
    expect(prompt).not.toContain('nesa-maths-k10');
    expect(r.external.map((e) => e.sourceId)).toEqual(['resolve']);
  });

  it('falls back to the rules week when the AI is down or picks nothing real', async () => {
    const rules = buildPathway({ ...body, units: UNITS });
    const down = await handlePathway(
      post(body),
      {},
      {
        complete: async () => {
          throw new Error('down');
        },
      },
    );
    const r1 = (await down.json()) as Res;
    expect(r1.source).toBe('rules');
    expect(r1.items.map((i) => i.unitId)).toEqual(rules.map((i) => i.unitId));
    const junk = await handlePathway(
      post(body),
      {},
      {
        complete: reply({ items: [{ unitId: 'nope', needId: 'nope', reason: 'x' }] }),
      },
    );
    expect(((await junk.json()) as Res).source).toBe('rules');
  });

  it('rejects student names in the needs', async () => {
    const res = await handlePathway(
      post({ ...body, needs: [{ ...needs[0]!, evidence: 'My student Jayden Smith is stuck' }] }),
      {},
      { complete: reply({ items: [] }) },
    );
    expect(res.status).toBe(400);
  });
});

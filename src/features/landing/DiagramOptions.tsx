import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { Hero, HeroMark } from './Landing';
import { DiagramCycle, DiagramGrid, DiagramOutline, DiagramTinted } from './HeroDiagrams';

// Temporary page for choosing the landing diagram (26 Nov 2026). Removed once Craig picks.
const OPTIONS: { key: string; name: string; note: string; diagram: ReactNode }[] = [
  {
    key: 'a',
    name: 'Option A: even white circles',
    note: 'Four equal circles, each name centred in the open part of its circle.',
    diagram: <DiagramOutline />,
  },
  {
    key: 'b',
    name: 'Option B: green and purple circles',
    note: 'The same shape filled in brand green and purple, names in white.',
    diagram: <DiagramTinted />,
  },
  {
    key: 'c',
    name: 'Option C: ruled grid with outcomes',
    note: 'Each product in its own square with what it does for a teacher. The icon sits where the lines cross.',
    diagram: <DiagramGrid />,
  },
  {
    key: 'd',
    name: 'Option D: a cycle',
    note: 'The four products as steps, left to right, looping back to the start.',
    diagram: <DiagramCycle />,
  },
  {
    key: 'now',
    name: 'Current: your brand icon',
    note: 'What is live now, for comparison.',
    diagram: <HeroMark />,
  },
];

export function DiagramOptions() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        {OPTIONS.map((o) => (
          <div key={o.key} id={`option-${o.key}`}>
            <div className="mx-auto max-w-[1200px] border-b border-rule px-4 py-4 sm:px-8">
              <h2 className="text-[22px]">{o.name}</h2>
              <p className="text-muted">{o.note}</p>
            </div>
            <Hero diagram={o.diagram} id={`hero-${o.key}`} />
          </div>
        ))}
      </main>
    </>
  );
}
export default DiagramOptions;

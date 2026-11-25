import { AllegroMark, type Product } from '@/components/AllegroMark';

// Options for the landing hero diagram, for Craig to choose from (26 Nov 2026).
// All four use exact geometry so the labels sit symmetrically. Order follows SPEC 10.4:
// clockwise from top-left, Equip, Embed, Evaluate, Elevate.

const NAMES = ['Equip', 'Embed', 'Evaluate', 'Elevate'] as const;
const LABEL = "Allegro's four products: Equip, Embed, Evaluate and Elevate";

// Four overlapping circles on a 400 square. Each label sits in the outer part of its
// circle, pushed away from the shared middle by the same distance.
const R = 95;
const C = [
  { x: 138, y: 138 },
  { x: 262, y: 138 },
  { x: 262, y: 262 },
  { x: 138, y: 262 },
];
const OUT_X = 26;
const OUT_Y = 30;
const labelAt = (i: number) => {
  const c = C[i]!;
  return { x: c.x + (c.x < 200 ? -OUT_X : OUT_X), y: c.y + (c.y < 200 ? -OUT_Y : OUT_Y) };
};

/** A: four even white circles, labels centred in each outer petal. */
export function DiagramOutline() {
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={LABEL} className="h-auto w-full">
      {C.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={R} fill="none" stroke="var(--white)" strokeWidth={5} />
      ))}
      {NAMES.map((n, i) => {
        const p = labelAt(i);
        return (
          <text
            key={n}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--ink)"
            className="font-heading"
            fontSize={22}
            fontWeight={600}
          >
            {n}
          </text>
        );
      })}
    </svg>
  );
}

/** B: the same circles filled, green and purple in turn, with white labels. */
export function DiagramTinted() {
  const fills = ['var(--green-700)', 'var(--plum-500)', 'var(--green-700)', 'var(--plum-500)'];
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={LABEL} className="h-auto w-full">
      {C.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={R}
          fill={fills[i]}
          fillOpacity={0.9}
          stroke="var(--white)"
          strokeWidth={4}
        />
      ))}
      {NAMES.map((n, i) => {
        const p = labelAt(i);
        return (
          <text
            key={n}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--white)"
            className="font-heading"
            fontSize={22}
            fontWeight={600}
          >
            {n}
          </text>
        );
      })}
    </svg>
  );
}

const OUTCOMES: Record<(typeof NAMES)[number], string> = {
  Equip: 'Walk into the classroom with confidence.',
  Embed: 'Better lessons in less planning time.',
  Evaluate: 'See your impact and keep improving.',
  Elevate: 'Grow capability across a school.',
};
const PRODUCT: Record<(typeof NAMES)[number], Exclude<Product, 'all'>> = {
  Equip: 'equip',
  Embed: 'embed',
  Evaluate: 'evaluate',
  Elevate: 'elevate',
};

/** C: a ruled 2x2 grid, one product per square with its outcome, the icon where the lines cross. */
export function DiagramGrid() {
  // Grid order reads clockwise: Equip, Embed on top; Elevate, Evaluate underneath.
  const order = ['Equip', 'Embed', 'Elevate', 'Evaluate'] as const;
  return (
    <figure className="relative">
      <ul aria-label={LABEL} className="grid grid-cols-2">
        {order.map((n, i) => (
          <li
            key={n}
            className={[
              'flex flex-col gap-2 p-4 sm:p-6',
              i % 2 === 0 ? 'border-r-2 border-ink' : '',
              i < 2 ? 'border-b-2 border-ink' : '',
              i % 2 === 1 ? 'items-end text-right' : '',
            ].join(' ')}
          >
            <AllegroMark product={PRODUCT[n]} tone="ink" size={32} />
            <span className="font-heading text-[22px] font-semibold leading-tight">{n}</span>
            <span className="text-[15px] leading-snug">{OUTCOMES[n]}</span>
          </li>
        ))}
      </ul>
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-sage-500">
        <img src="/brand/icon.svg" alt="" width={56} height={56} />
      </span>
    </figure>
  );
}

/** D: a cycle left to right, Equip to Elevate, with a line back to the start. */
export function DiagramCycle() {
  const r = 33;
  const xs = [50, 150, 250, 350];
  const y = 110;
  return (
    <svg
      viewBox="0 0 400 260"
      role="img"
      aria-label={`${LABEL}, in a repeating cycle`}
      className="h-auto w-full"
    >
      <defs>
        <marker
          id="cycle-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--ink)" />
        </marker>
      </defs>
      {xs.slice(0, 3).map((x) => (
        <line
          key={x}
          x1={x + r + 4}
          y1={y}
          x2={x + 100 - r - 6}
          y2={y}
          stroke="var(--ink)"
          strokeWidth={2.5}
          markerEnd="url(#cycle-arrow)"
        />
      ))}
      <path
        d={`M ${xs[3]} ${y + r + 4} C ${xs[3]} 250, ${xs[0]} 250, ${xs[0]} ${y + r + 8}`}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={2.5}
        strokeDasharray="6 6"
        markerEnd="url(#cycle-arrow)"
      />
      {xs.map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill="none" stroke="var(--white)" strokeWidth={5} />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--ink)"
            className="font-heading"
            fontSize={28}
            fontWeight={600}
          >
            {i + 1}
          </text>
          <text
            x={x}
            y={y - r - 20}
            textAnchor="middle"
            fill="var(--ink)"
            className="font-heading"
            fontSize={19}
            fontWeight={600}
          >
            {NAMES[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

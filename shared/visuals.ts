import { z } from 'zod';

// Maths diagrams drawn from a small spec, never freehand, so they are always mathematically
// right: bar models, number lines, arrays, area models, ten frames and coordinate graphs.
//
// In Markdown a diagram is a fenced block with the language "visual" holding JSON, e.g.
//
//   ```visual
//   { "type": "number_line", "min": -3, "max": 5, "jumps": [{ "from": -2, "to": 3, "label": "+5" }] }
//   ```
//
// `visualSvg` returns an SVG string. Colours come in as a palette so the screen can use the
// tokens (var(--ink) and so on) and the Word download can use the computed values.
// Pure, so the browser, the review export and the tests all share it.

const label = z.string().max(40);
const num = z.number().finite();

const BarModel = z.object({
  type: z.literal('bar_model'),
  bars: z
    .array(
      z.object({
        label: label.optional(),
        parts: z
          .array(
            z.object({
              /** Relative width; parts in every bar share one scale. */
              size: num.positive().max(1000).default(1),
              label: label.optional(),
              shaded: z.boolean().optional(),
            }),
          )
          .min(1)
          .max(12),
      }),
    )
    .min(1)
    .max(4),
  /** A brace under the whole diagram, e.g. "35 students". */
  total: label.optional(),
});

const NumberLine = z
  .object({
    type: z.literal('number_line'),
    min: num,
    max: num,
    step: num.positive().default(1),
    points: z
      .array(z.object({ value: num, label: label.optional() }))
      .max(8)
      .default([]),
    jumps: z
      .array(z.object({ from: num, to: num, label: label.optional() }))
      .max(8)
      .default([]),
  })
  .refine((v) => v.max > v.min && (v.max - v.min) / v.step <= 24, 'Up to 24 steps');

const ArrayModel = z.object({
  type: z.literal('array'),
  rows: z.number().int().min(1).max(12),
  cols: z.number().int().min(1).max(12),
  caption: label.optional(),
});

const AreaModel = z.object({
  type: z.literal('area_model'),
  /** Parts of the side lengths, e.g. [20, 3] by [10, 4] for 23 × 14. */
  rows: z
    .array(z.union([num, label]))
    .min(1)
    .max(4),
  cols: z
    .array(z.union([num, label]))
    .min(1)
    .max(4),
  showProducts: z.boolean().default(true),
});

const TenFrame = z.object({
  type: z.literal('ten_frame'),
  /** Counters shown, filled left to right, top row first. Up to 20 uses two frames. */
  filled: z.number().int().min(0).max(20),
});

const Balance = z.object({
  type: z.literal('balance'),
  /** What sits in each pan, e.g. ["7", "5"] and ["□", "8"]. */
  left: z.array(label).min(1).max(5),
  right: z.array(label).min(1).max(5),
});

const Graph = z
  .object({
    type: z.literal('graph'),
    xMin: num.default(-5),
    xMax: num.default(5),
    yMin: num.default(-5),
    yMax: num.default(10),
    lines: z
      .array(z.object({ m: num, c: num, label: label.optional() }))
      .max(3)
      .default([]),
    points: z
      .array(z.object({ x: num, y: num, label: label.optional() }))
      .max(10)
      .default([]),
    xLabel: label.optional(),
    yLabel: label.optional(),
  })
  .refine(
    (g) => g.xMax > g.xMin && g.yMax > g.yMin && g.xMax - g.xMin <= 30 && g.yMax - g.yMin <= 40,
    'Axes must be small enough to read',
  );

export const VisualSpecSchema = z.union([
  BarModel,
  NumberLine,
  ArrayModel,
  AreaModel,
  TenFrame,
  Balance,
  Graph,
]);
export type VisualSpec = z.infer<typeof VisualSpecSchema>;

export interface Palette {
  ink: string;
  muted: string;
  grid: string;
  fill: string;
  accent: string;
  line: string;
  paper: string;
  font: string;
}

/** Screen palette: design tokens straight from tokens.css. */
export const SCREEN_PALETTE: Palette = {
  ink: 'var(--ink)',
  muted: 'var(--muted)',
  grid: 'var(--grid)',
  fill: 'var(--plum-100)',
  accent: 'var(--plum-500)',
  line: 'var(--green-700)',
  paper: 'transparent',
  font: 'var(--font-body)',
};

export type ParsedVisual = { ok: true; spec: VisualSpec } | { ok: false; error: string };

export function parseVisual(raw: string): ParsedVisual {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'not JSON' };
  }
  const r = VisualSpecSchema.safeParse(json);
  return r.success ? { ok: true, spec: r.data } : { ok: false, error: r.error.issues[0]!.message };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Minus signs read better than hyphens in maths. */
const fmt = (v: number | string) =>
  typeof v === 'number' ? String(Math.round(v * 1000) / 1000).replace('-', '−') : v;

const text = (
  p: Palette,
  x: number,
  y: number,
  s: number | string,
  o: { size?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string; bold?: boolean } = {},
) =>
  `<text x="${x}" y="${y}" font-family="${p.font}" font-size="${o.size ?? 15}" text-anchor="${o.anchor ?? 'middle'}" fill="${o.fill ?? p.ink}"${o.bold ? ' font-weight="700"' : ''}>${esc(fmt(s))}</text>`;

const line = (p: string, x1: number, y1: number, x2: number, y2: number, w = 1.5, extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p}" stroke-width="${w}"${extra}/>`;

interface Drawn {
  width: number;
  height: number;
  body: string;
}

function barModel(v: z.infer<typeof BarModel>, p: Palette): Drawn {
  const labelW = v.bars.some((b) => b.label) ? 90 : 0;
  const maxTotal = Math.max(...v.bars.map((b) => b.parts.reduce((s, x) => s + x.size, 0)));
  const barW = 420;
  const h = 40;
  const gap = 16;
  const parts: string[] = [];
  v.bars.forEach((b, bi) => {
    const y = 10 + bi * (h + gap);
    if (b.label) parts.push(text(p, labelW - 10, y + h / 2 + 5, b.label, { anchor: 'end' }));
    let x = labelW;
    for (const part of b.parts) {
      const w = (part.size / maxTotal) * barW;
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${part.shaded ? p.fill : p.paper}" stroke="${p.ink}" stroke-width="1.5"/>`,
      );
      if (part.label) parts.push(text(p, x + w / 2, y + h / 2 + 5, part.label));
      x += w;
    }
  });
  let height = 10 + v.bars.length * (h + gap);
  if (v.total) {
    const y = height - 4;
    const x2 = labelW + barW;
    parts.push(
      `<path d="M${labelW} ${y} q0 10 10 10 H${(labelW + x2) / 2 - 8} q8 0 8 8 q0 -8 8 -8 H${x2 - 10} q10 0 10 -10" fill="none" stroke="${p.ink}" stroke-width="1.5"/>`,
      text(p, (labelW + x2) / 2, y + 36, v.total),
    );
    height += 44;
  }
  return { width: labelW + barW + 10, height, body: parts.join('') };
}

function numberLine(v: z.infer<typeof NumberLine>, p: Palette): Drawn {
  const width = 520;
  const pad = 30;
  const y = v.jumps.length ? 80 : 40;
  const sx = (n: number) => pad + ((n - v.min) / (v.max - v.min)) * (width - 2 * pad);
  const out = [
    line(p.ink, pad - 16, y, width - pad + 16, y, 1.5),
    `<path d="M${pad - 16} ${y} l8 -5 v10 z M${width - pad + 16} ${y} l-8 -5 v10 z" fill="${p.ink}"/>`,
  ];
  const steps = Math.round((v.max - v.min) / v.step);
  for (let i = 0; i <= steps; i++) {
    const n = v.min + i * v.step;
    out.push(line(p.ink, sx(n), y - 6, sx(n), y + 6), text(p, sx(n), y + 24, n, { size: 14 }));
  }
  v.jumps.forEach((j, i) => {
    const x1 = sx(j.from);
    const x2 = sx(j.to);
    const top = y - 30 - (i % 2) * 14;
    out.push(
      `<path d="M${x1} ${y - 8} Q${(x1 + x2) / 2} ${top - 20} ${x2} ${y - 8}" fill="none" stroke="${p.accent}" stroke-width="2"/>`,
      `<path d="M${x2} ${y - 8} l${x2 > x1 ? -9 : 9} -5 l${x2 > x1 ? 2 : -2} 9 z" fill="${p.accent}"/>`,
    );
    if (j.label)
      out.push(text(p, (x1 + x2) / 2, top - 14, j.label, { fill: p.accent, bold: true }));
  });
  for (const pt of v.points) {
    out.push(`<circle cx="${sx(pt.value)}" cy="${y}" r="6" fill="${p.line}"/>`);
    if (pt.label) out.push(text(p, sx(pt.value), y + 44, pt.label, { bold: true, fill: p.line }));
  }
  return { width, height: y + (v.points.some((x) => x.label) ? 54 : 36), body: out.join('') };
}

function arrayModel(v: z.infer<typeof ArrayModel>, p: Palette): Drawn {
  const gap = 28;
  const out: string[] = [];
  for (let r = 0; r < v.rows; r++)
    for (let c = 0; c < v.cols; c++)
      out.push(`<circle cx="${20 + c * gap}" cy="${20 + r * gap}" r="9" fill="${p.accent}"/>`);
  const width = Math.max(40 + (v.cols - 1) * gap, v.caption ? 200 : 0);
  let height = 40 + (v.rows - 1) * gap;
  if (v.caption) {
    out.push(text(p, width / 2, height + 14, v.caption));
    height += 26;
  }
  return { width, height, body: out.join('') };
}

function areaModel(v: z.infer<typeof AreaModel>, p: Palette): Drawn {
  const numeric = (xs: (number | string)[]) => xs.every((x) => typeof x === 'number' && x > 0);
  const sizes = (xs: (number | string)[], total: number) => {
    if (!numeric(xs)) return xs.map(() => total / xs.length);
    const s = (xs as number[]).reduce((a, b) => a + b, 0);
    // Keep thin parts readable: at least 60px each.
    const raw = (xs as number[]).map((x) => (x / s) * total);
    const fixed = raw.map((r) => Math.max(r, 60));
    const k = total / fixed.reduce((a, b) => a + b, 0);
    return fixed.map((f) => f * k);
  };
  const left = 50;
  const top = 34;
  const W = 380;
  const H = Math.min(260, Math.max(120, v.rows.length * 70));
  const cw = sizes(v.cols, W);
  const rh = sizes(v.rows, H);
  const out: string[] = [];
  let y = top;
  v.rows.forEach((r, ri) => {
    let x = left;
    v.cols.forEach((c, ci) => {
      out.push(
        `<rect x="${x}" y="${y}" width="${cw[ci]}" height="${rh[ri]}" fill="${(ri + ci) % 2 ? p.paper : p.fill}" stroke="${p.ink}" stroke-width="1.5"/>`,
      );
      if (v.showProducts && typeof r === 'number' && typeof c === 'number')
        out.push(text(p, x + cw[ci]! / 2, y + rh[ri]! / 2 + 5, r * c, { bold: true }));
      if (ri === 0) out.push(text(p, x + cw[ci]! / 2, top - 10, c));
      x += cw[ci]!;
    });
    out.push(text(p, left - 10, y + rh[ri]! / 2 + 5, r, { anchor: 'end' }));
    y += rh[ri]!;
  });
  return { width: left + W + 10, height: top + H + 10, body: out.join('') };
}

function tenFrame(v: z.infer<typeof TenFrame>, p: Palette): Drawn {
  const frames = v.filled > 10 ? 2 : 1;
  const cell = 40;
  const out: string[] = [];
  for (let f = 0; f < frames; f++) {
    const ox = 10 + f * (5 * cell + 24);
    for (let i = 0; i < 10; i++) {
      const x = ox + (i % 5) * cell;
      const y = 10 + Math.floor(i / 5) * cell;
      out.push(
        `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${p.paper}" stroke="${p.ink}" stroke-width="1.5"/>`,
      );
      if (f * 10 + i < v.filled)
        out.push(`<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="13" fill="${p.accent}"/>`);
    }
  }
  return {
    width: 20 + frames * 5 * cell + (frames - 1) * 24,
    height: 20 + 2 * cell,
    body: out.join(''),
  };
}

function balance(v: z.infer<typeof Balance>, p: Palette): Drawn {
  const width = 460;
  const beamY = 40;
  const panY = beamY + 80;
  const out = [
    `<path d="M${width / 2} ${beamY} L${width / 2 - 26} ${panY + 50} H${width / 2 + 26} Z" fill="${p.fill}" stroke="${p.ink}" stroke-width="1.5"/>`,
    line(p.ink, 40, beamY, width - 40, beamY, 3),
  ];
  const pan = (items: string[], cx: number) => {
    const w = 42;
    const total = items.length * w + (items.length - 1) * 6;
    out.push(
      line(p.ink, cx, beamY, cx - 70, panY, 1.2),
      line(p.ink, cx, beamY, cx + 70, panY, 1.2),
      `<path d="M${cx - 84} ${panY} H${cx + 84} l-14 14 H${cx - 70} Z" fill="${p.paper}" stroke="${p.ink}" stroke-width="1.5"/>`,
    );
    items.forEach((it, i) => {
      const x = cx - total / 2 + i * (w + 6);
      out.push(
        `<rect x="${x}" y="${panY - 36}" width="${w}" height="36" fill="${p.fill}" stroke="${p.accent}" stroke-width="1.5"/>`,
        text(p, x + w / 2, panY - 12, it, { bold: true, size: 17 }),
      );
    });
  };
  pan(v.left, 120);
  pan(v.right, width - 120);
  return { width, height: panY + 56, body: out.join('') };
}

/** A short, stable id so two graphs on one page don't share a clip path. */
function idFor(v: unknown): string {
  let h = 0;
  for (const ch of JSON.stringify(v)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return `plot${(h >>> 0).toString(36)}`;
}

function graph(v: z.infer<typeof Graph>, p: Palette): Drawn {
  const cid = idFor(v);
  // Each axis gets its own scale so a steep line still fits a readable, landscape-ish box.
  const xu = Math.max(18, Math.min(48, Math.floor(420 / (v.xMax - v.xMin))));
  // Never much taller than wide, so graphs stay compact on screen and in print.
  const maxPlotH = Math.min(320, Math.max(220, (v.xMax - v.xMin) * xu * 1.1));
  const yu = Math.max(8, Math.min(xu, Math.floor(maxPlotH / (v.yMax - v.yMin))));
  const pad = 34;
  const width = pad * 2 + (v.xMax - v.xMin) * xu;
  const height = pad * 2 + (v.yMax - v.yMin) * yu;
  const sx = (x: number) => pad + (x - v.xMin) * xu;
  const sy = (y: number) => pad + (v.yMax - y) * yu;
  const out: string[] = [];
  // Label every grid line when there's room, otherwise every second or fifth.
  const stepFor = (u: number) => (u >= 22 ? 1 : u >= 11 ? 2 : u >= 5 ? 5 : 10);
  const xEvery = stepFor(xu);
  const yEvery = stepFor(yu);
  for (let x = Math.ceil(v.xMin); x <= v.xMax; x++) {
    out.push(line(p.grid, sx(x), sy(v.yMax), sx(x), sy(v.yMin), 1));
    if (x !== 0 && x % xEvery === 0)
      out.push(text(p, sx(x), sy(Math.max(v.yMin, Math.min(0, v.yMax))) + 18, x, { size: 12 }));
  }
  for (let y = Math.ceil(v.yMin); y <= v.yMax; y++) {
    out.push(line(p.grid, sx(v.xMin), sy(y), sx(v.xMax), sy(y), 1));
    if (y !== 0 && y % yEvery === 0)
      out.push(
        text(p, sx(Math.max(v.xMin, Math.min(0, v.xMax))) - 8, sy(y) + 4, y, {
          size: 12,
          anchor: 'end',
        }),
      );
  }
  const ax = sx(Math.max(v.xMin, Math.min(0, v.xMax)));
  const ay = sy(Math.max(v.yMin, Math.min(0, v.yMax)));
  out.push(
    line(p.ink, sx(v.xMin), ay, sx(v.xMax), ay, 1.5),
    line(p.ink, ax, sy(v.yMin), ax, sy(v.yMax), 1.5),
  );
  out.push(
    text(p, sx(v.xMax) + 14, ay + 5, v.xLabel ?? 'x', { bold: true }),
    text(p, ax, sy(v.yMax) - 12, v.yLabel ?? 'y', { bold: true }),
  );
  if (v.xMin <= 0 && v.xMax >= 0 && v.yMin <= 0 && v.yMax >= 0)
    out.push(text(p, ax - 8, ay + 18, 0, { size: 12, anchor: 'end' }));
  out.push(
    `<clipPath id="${cid}"><rect x="${sx(v.xMin)}" y="${sy(v.yMax)}" width="${sx(v.xMax) - sx(v.xMin)}" height="${sy(v.yMin) - sy(v.yMax)}"/></clipPath>`,
  );
  for (const l of v.lines) {
    out.push(
      line(
        p.line,
        sx(v.xMin),
        sy(l.m * v.xMin + l.c),
        sx(v.xMax),
        sy(l.m * v.xMax + l.c),
        2.5,
        ` clip-path="url(#${cid})"`,
      ),
    );
    if (l.label) {
      // Put the label where the line is inside the grid, near the right-hand end.
      let lx = v.xMax - 0.5;
      while (lx > v.xMin && (l.m * lx + l.c > v.yMax - 0.5 || l.m * lx + l.c < v.yMin + 0.5))
        lx -= 0.5;
      out.push(
        text(p, sx(lx) - 6, sy(l.m * lx + l.c) - 10, l.label, {
          anchor: 'end',
          fill: p.line,
          bold: true,
        }),
      );
    }
  }
  for (const pt of v.points) {
    out.push(`<circle cx="${sx(pt.x)}" cy="${sy(pt.y)}" r="5" fill="${p.accent}"/>`);
    if (pt.label)
      out.push(text(p, sx(pt.x) + 8, sy(pt.y) - 8, pt.label, { anchor: 'start', size: 13 }));
  }
  return { width: width + 14, height, body: out.join('') };
}

/** A plain description of the diagram, for screen readers and text-only copies. */
export function describeVisual(v: VisualSpec): string {
  switch (v.type) {
    case 'bar_model':
      return `Bar model: ${v.bars
        .map(
          (b) =>
            `${b.label ? `${b.label}, ` : ''}${b.parts.length} part${b.parts.length > 1 ? 's' : ''}${
              b.parts.some((x) => x.label)
                ? ` (${b.parts.map((x) => x.label ?? '').join(', ')})`
                : ''
            }`,
        )
        .join('; ')}${v.total ? `; total ${v.total}` : ''}.`;
    case 'number_line':
      return `Number line from ${fmt(v.min)} to ${fmt(v.max)}${v.jumps
        .map((j) => `, a jump from ${fmt(j.from)} to ${fmt(j.to)}${j.label ? ` (${j.label})` : ''}`)
        .join(
          '',
        )}${v.points.map((x) => `, a point at ${fmt(x.value)}${x.label ? ` (${x.label})` : ''}`).join('')}.`;
    case 'array':
      return `Array of ${v.rows} rows and ${v.cols} columns${v.caption ? `: ${v.caption}` : ''}.`;
    case 'area_model':
      return `Area model: ${v.rows.map(fmt).join(' + ')} by ${v.cols.map(fmt).join(' + ')}.`;
    case 'ten_frame':
      return `Ten frame${v.filled > 10 ? 's' : ''} with ${v.filled} counters.`;
    case 'balance':
      return `Balance with ${v.left.join(' and ')} on the left and ${v.right.join(' and ')} on the right, level.`;
    case 'graph':
      return `Graph with x from ${fmt(v.xMin)} to ${fmt(v.xMax)} and y from ${fmt(v.yMin)} to ${fmt(v.yMax)}${v.lines
        .map(
          (l) =>
            `, the line y = ${l.m === 1 ? '' : l.m === -1 ? '−' : fmt(l.m)}x ${l.c < 0 ? '−' : '+'} ${fmt(Math.abs(l.c))}`,
        )
        .join('')}${v.points.map((x) => `, the point (${fmt(x.x)}, ${fmt(x.y)})`).join('')}.`;
  }
}

/** The diagram as an SVG string, with its natural size. */
export function visualSvg(
  v: VisualSpec,
  p: Palette = SCREEN_PALETTE,
): { svg: string; width: number; height: number } {
  const d =
    v.type === 'bar_model'
      ? barModel(v, p)
      : v.type === 'number_line'
        ? numberLine(v, p)
        : v.type === 'array'
          ? arrayModel(v, p)
          : v.type === 'area_model'
            ? areaModel(v, p)
            : v.type === 'ten_frame'
              ? tenFrame(v, p)
              : v.type === 'balance'
                ? balance(v, p)
                : graph(v, p);
  const w = Math.ceil(d.width);
  const h = Math.ceil(d.height);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(describeVisual(v))}">${p.paper !== 'transparent' ? `<rect width="${w}" height="${h}" fill="${p.paper}"/>` : ''}${d.body}</svg>`;
  return { svg, width: w, height: h };
}

/** Every ```visual block in a piece of Markdown. */
export function visualBlocksIn(md: string): string[] {
  return [...md.matchAll(/```visual\s*\n([\s\S]*?)```/g)].map((m) => m[1]!.trim());
}

import {
  MathFraction,
  MathRadical,
  MathRoundBrackets,
  MathRun,
  MathSquareBrackets,
  MathSubScript,
  MathSubSuperScript,
  MathSuperScript,
  type MathComponent,
} from 'docx';

// Turns the LaTeX that teachers and the AI write ($\frac{3}{4}$, $x^2$, $\sqrt{9}$) into real
// Word equations, so maths in "Download as Word" looks like maths and can be edited in Word.
// Covers the school maths Allegro uses: fractions, powers, subscripts, roots, brackets and
// common symbols. Anything unknown is kept as plain text rather than dropped.

const SYMBOLS: Record<string, string> = {
  times: '×',
  div: '÷',
  pm: '±',
  mp: '∓',
  cdot: '·',
  le: '≤',
  leq: '≤',
  ge: '≥',
  geq: '≥',
  ne: '≠',
  neq: '≠',
  approx: '≈',
  pi: 'π',
  theta: 'θ',
  alpha: 'α',
  beta: 'β',
  infty: '∞',
  circ: '°',
  degree: '°',
  angle: '∠',
  triangle: '△',
  square: '□',
  ldots: '…',
  dots: '…',
  cdots: '⋯',
  to: '→',
  rightarrow: '→',
  '%': '%',
  $: '$',
  ',': ' ',
  ';': ' ',
  quad: '  ',
  qquad: '    ',
  '{': '{',
  '}': '}',
};

type Atom = string | MathComponent;

class Reader {
  i = 0;
  constructor(readonly s: string) {}
  get done() {
    return this.i >= this.s.length;
  }
  peek() {
    return this.s[this.i] ?? '';
  }
  /** A {group}, a \command, or one character. */
  group(): string {
    while (this.peek() === ' ') this.i++;
    if (this.peek() === '{') {
      let depth = 0;
      const start = this.i;
      for (; this.i < this.s.length; this.i++) {
        if (this.s[this.i] === '{') depth++;
        else if (this.s[this.i] === '}' && --depth === 0) break;
      }
      this.i++;
      return this.s.slice(start + 1, this.i - 1);
    }
    if (this.peek() === '\\') {
      const m = /^\\([A-Za-z]+|.)/.exec(this.s.slice(this.i));
      this.i += m ? m[0].length : 1;
      return m ? m[0] : '';
    }
    return this.s[this.i++] ?? '';
  }
  optional(): string | undefined {
    if (this.peek() !== '[') return undefined;
    const end = this.s.indexOf(']', this.i);
    if (end < 0) return undefined;
    const v = this.s.slice(this.i + 1, end);
    this.i = end + 1;
    return v;
  }
}

/** Merges neighbouring text into single runs. */
function runs(atoms: Atom[]): MathComponent[] {
  const out: MathComponent[] = [];
  let text = '';
  for (const a of atoms) {
    if (typeof a === 'string') text += a;
    else {
      if (text) out.push(new MathRun(text));
      text = '';
      out.push(a);
    }
  }
  if (text) out.push(new MathRun(text));
  return out;
}

function parse(src: string): Atom[] {
  const r = new Reader(src);
  const atoms: Atom[] = [];
  while (!r.done) {
    const c = r.peek();
    if (c === '^' || c === '_') {
      // Scripts attach to the last thing written: a group, or the last character.
      r.i++;
      const first = r.group();
      let sup: string | undefined;
      let sub: string | undefined;
      if (c === '^') sup = first;
      else sub = first;
      const next = r.peek();
      if ((next === '^' && sup === undefined) || (next === '_' && sub === undefined)) {
        r.i++;
        if (next === '^') sup = r.group();
        else sub = r.group();
      }
      const last = atoms.pop() ?? '';
      let base: MathComponent[];
      if (typeof last === 'string' && last.length > 1) {
        atoms.push(last.slice(0, -1));
        base = [new MathRun(last.slice(-1))];
      } else base = runs([last]);
      const children = base.length ? base : [new MathRun('')];
      atoms.push(
        sup !== undefined && sub !== undefined
          ? new MathSubSuperScript({
              children,
              subScript: runs(parse(sub)),
              superScript: runs(parse(sup)),
            })
          : sup !== undefined
            ? new MathSuperScript({ children, superScript: runs(parse(sup)) })
            : new MathSubScript({ children, subScript: runs(parse(sub!)) }),
      );
      continue;
    }
    if (c === '{') {
      atoms.push(...runs(parse(r.group())));
      continue;
    }
    if (c === '\\') {
      const cmd = r.group().slice(1);
      if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
        const num = r.group();
        const den = r.group();
        atoms.push(
          new MathFraction({ numerator: runs(parse(num)), denominator: runs(parse(den)) }),
        );
      } else if (cmd === 'sqrt') {
        const degree = r.optional();
        atoms.push(
          new MathRadical({
            children: runs(parse(r.group())),
            degree: degree ? runs(parse(degree)) : undefined,
          }),
        );
      } else if (cmd === 'left') {
        const open = r.group();
        let depth = 1;
        const start = r.i;
        let end = start;
        while (!r.done) {
          if (r.s.startsWith('\\left', r.i)) depth++;
          if (r.s.startsWith('\\right', r.i) && --depth === 0) {
            end = r.i;
            r.i += 6;
            r.group();
            break;
          }
          r.i++;
        }
        const inner = runs(parse(r.s.slice(start, end || r.i)));
        if (open === '(') atoms.push(new MathRoundBrackets({ children: inner }));
        else if (open === '[') atoms.push(new MathSquareBrackets({ children: inner }));
        else atoms.push(open.replace(/^\\/, ''), ...inner);
      } else if (cmd === 'text' || cmd === 'mathrm' || cmd === 'textrm' || cmd === 'mathbf') {
        atoms.push(r.group());
      } else if (cmd === 'right') {
        r.group();
      } else atoms.push(SYMBOLS[cmd] ?? cmd);
      continue;
    }
    r.i++;
    atoms.push(c === '-' ? '−' : c);
  }
  return atoms;
}

/** Word equation parts for one $...$ (put them inside a docx `Math`). */
export function latexToMath(tex: string): MathComponent[] {
  const out = runs(parse(tex.trim()));
  return out.length ? out : [new MathRun(tex)];
}

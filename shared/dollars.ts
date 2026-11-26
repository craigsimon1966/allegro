// Money in maths text. Lessons write dollar amounts as `\$24` in words and `$\$24$` inside maths,
// which is valid LaTeX. But the Markdown maths parser (and our Word and slide parser) treats any
// `$` as the end of the maths, so `$\$24$` broke the rest of the block into garbled italic
// letters. This rewrites `\$` inside maths as `\dollar{}`, which the renderers turn back into a
// dollar sign, and leaves `\$` in words alone (Markdown already reads that as a plain `$`).

/** The macro `\dollar` stands for: KaTeX's own dollar sign. */
export const KATEX_MACROS = { '\\dollar': '\\$' };

/** Rewrites `\$` inside `$...$` and `$$...$$` as `\dollar{}`. Code is left alone. Idempotent. */
export function protectDollars(md: string): string {
  if (!md.includes('\\$')) return md;
  let out = '';
  let inFence = false;
  // 0 outside maths, else the number of $ that opened it. Maths can run over a single line
  // break ($$ blocks) but never over a blank line.
  let open = 0;
  md.split('\n').forEach((line, n) => {
    if (n > 0) out += '\n';
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      open = 0;
      out += line;
      return;
    }
    if (inFence) {
      out += line;
      return;
    }
    if (!line.trim()) open = 0;
    let i = 0;
    while (i < line.length) {
      const c = line[i]!;
      const next = line[i + 1];
      if (c === '\\' && next !== undefined) {
        out += open && next === '$' ? '\\dollar{}' : c + next;
        i += 2;
      } else if (c === '`' && !open && line.indexOf('`', i + 1) > i) {
        const end = line.indexOf('`', i + 1);
        out += line.slice(i, end + 1);
        i = end + 1;
      } else if (c === '$') {
        const run = next === '$' ? 2 : 1;
        if (!open) open = run;
        else if (run === open) open = 0;
        out += '$'.repeat(run);
        i += run;
      } else {
        out += c;
        i++;
      }
    }
  });
  return out;
}

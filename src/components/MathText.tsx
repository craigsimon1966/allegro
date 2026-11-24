import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Renders Markdown (with tables) and KaTeX maths ($...$ inline, $$...$$ display).
 * KaTeX outputs MathML alongside HTML so screen readers can read the maths (SPEC 11).
 * Raw HTML in the source is not rendered, so AI output can't inject markup.
 * `inline` drops the paragraph wrapper, for use inside labels and buttons.
 */
export function MathText({
  children,
  className = '',
  inline = false,
}: {
  children: string;
  className?: string;
  inline?: boolean;
}) {
  const md = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { output: 'htmlAndMathml', throwOnError: false }]]}
      components={inline ? { p: ({ children: c }) => <>{c}</> } : undefined}
    >
      {children}
    </ReactMarkdown>
  );
  return inline ? (
    <span className={`math-text ${className}`}>{md}</span>
  ) : (
    <div className={`math-text max-w-prose ${className}`}>{md}</div>
  );
}

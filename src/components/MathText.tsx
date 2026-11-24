import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Renders Markdown with KaTeX maths ($...$ inline, $$...$$ display).
 * KaTeX outputs MathML alongside HTML so screen readers can read the maths (SPEC 11).
 * Raw HTML in the source is not rendered, so AI output can't inject markup.
 */
export function MathText({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`math-text max-w-prose ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { output: 'htmlAndMathml', throwOnError: false }]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

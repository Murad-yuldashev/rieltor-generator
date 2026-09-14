import ReactMarkdown from 'react-markdown';

/** Renders trusted-but-sanitized Markdown. No rehype-raw / no dangerouslySetInnerHTML —
 *  raw HTML in the source is NOT rendered, and react-markdown's default URL transform
 *  strips javascript: — so a malicious body cannot execute (R1).
 *
 *  Default-exported so the article page can `React.lazy` it — this keeps react-markdown
 *  (and its micromark tree) out of the entry bundle, in its own async chunk (R6). */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-article flex flex-col gap-3 text-[15px] leading-relaxed text-ink [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-bold [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

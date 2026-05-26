import { useMemo } from "react";
import { markdownToSafeHtml } from "@/lib/blog/markdown";

interface Props {
  /** Pre-rendered HTML (preferred — server/editor render). */
  html?: string | null;
  /** Fallback markdown source to render client-side. */
  markdown?: string | null;
  className?: string;
}

/**
 * Renders sanitized blog article HTML with editorial typography.
 * Use Tailwind `prose` tokens via the `blog-prose` class defined in index.css.
 */
export default function BlogMarkdownContent({ html, markdown, className }: Props) {
  const rendered = useMemo(() => {
    if (html && html.trim().length > 0) return html;
    if (markdown) return markdownToSafeHtml(markdown);
    return "";
  }, [html, markdown]);

  return (
    <div
      className={`blog-prose ${className ?? ""}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

import { useMemo } from "react";
import { markdownToSafeHtml } from "@/lib/blog/markdown";

interface Props {
  html?: string | null;
  markdown?: string | null;
  className?: string;
  /** Apply publication-specific typography variant. */
  variant?: "pro" | "journal";
}

export default function BlogMarkdownContent({ html, markdown, className, variant }: Props) {
  const rendered = useMemo(() => {
    if (html && html.trim().length > 0) {
      // re-sanitize HTML produced by editor preview, and apply pre-processing too
      if (markdown && markdown.trim().length > 0) return markdownToSafeHtml(markdown);
      return html;
    }
    if (markdown) return markdownToSafeHtml(markdown);
    return "";
  }, [html, markdown]);

  const variantClass = variant === "journal" ? "journal" : variant === "pro" ? "pro" : "";

  return (
    <div
      className={`blog-prose ${variantClass} ${className ?? ""}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

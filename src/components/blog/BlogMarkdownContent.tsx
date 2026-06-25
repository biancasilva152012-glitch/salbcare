import { useMemo } from "react";
import DOMPurify from "dompurify";
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
      // Prefer the markdown source when available — it goes through the
      // sanitized pipeline. When only HTML exists, sanitize it here so that
      // stored HTML (even from a compromised admin) can never inject scripts.
      if (markdown && markdown.trim().length > 0) return markdownToSafeHtml(markdown);
      if (typeof window === "undefined") return html;
      return DOMPurify.sanitize(html, {
        ADD_ATTR: ["target", "rel", "loading"],
        ADD_TAGS: ["aside"],
      });
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

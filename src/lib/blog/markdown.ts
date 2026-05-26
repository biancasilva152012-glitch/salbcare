import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: false });

export function markdownToSafeHtml(md: string): string {
  if (!md) return "";
  const raw = marked.parse(md) as string;
  if (typeof window === "undefined") return raw;
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "rel", "loading"],
  });
}

export function countWords(md: string): number {
  if (!md) return 0;
  // Strip code fences/inline code/markdown markers, then count words
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]+/g, " ");
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

export function estimateReadTime(md: string): number {
  const wpm = 220;
  return Math.max(1, Math.round(countWords(md) / wpm));
}

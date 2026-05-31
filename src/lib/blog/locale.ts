import type { BlogLang } from "./types";

const STORAGE_KEY = "salbcare_lang";
const SUPPORTED: BlogLang[] = ["en", "pt", "es"];

export function detectInitialLang(): BlogLang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored as BlogLang)) return stored as BlogLang;
  } catch {}
  const nav = (typeof navigator !== "undefined" ? navigator.language : "en").toLowerCase();
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("es")) return "es";
  return "en";
}

export function persistLang(lang: BlogLang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

/**
 * Read locale from a URL pathname. Supports prefixes /en, /pt, /es.
 * Returns null when no prefix is present (treat as default = en).
 */
export function langFromPath(pathname: string): BlogLang | null {
  const m = pathname.match(/^\/(en|pt|es)(\/|$)/);
  return m ? (m[1] as BlogLang) : null;
}

export function stripLangPrefix(pathname: string): string {
  return pathname.replace(/^\/(en|pt|es)(\/|$)/, "/");
}

export function withLangPrefix(path: string, lang: BlogLang): string {
  if (lang === "en") return path; // EN is the un-prefixed default
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${clean}`;
}

export const BLOG_LANGS: BlogLang[] = SUPPORTED;

export function langLabel(lang: BlogLang): string {
  return lang === "en" ? "English" : lang === "pt" ? "Português" : "Español";
}

/**
 * Maps a publication slug from the DB ("journal" | "pro") to its URL segment.
 * The international "journal" publication lives at /journal/main (the hub is /journal).
 */
export function pubUrlSegment(slug: string | null | undefined): string {
  return slug === "journal" ? "main" : (slug ?? "");
}


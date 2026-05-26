export type BlogLang = "en" | "pt" | "es";

export interface BlogAuthor {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  bio_en: string | null;
  bio_pt: string | null;
  bio_es: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  is_active: boolean;
}

export interface BlogCategory {
  id: string;
  slug: string;
  name_en: string;
  name_pt: string | null;
  name_es: string | null;
  description_en: string | null;
  description_pt: string | null;
  description_es: string | null;
  display_order: number;
  is_active: boolean;
}

export interface BlogTag {
  id: string;
  slug: string;
  name_en: string;
  name_pt: string | null;
  name_es: string | null;
}

export interface BlogTranslation {
  id: string;
  article_id: string;
  language: BlogLang;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content_markdown: string | null;
  content_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  word_count: number | null;
}

export interface BlogArticle {
  id: string;
  slug: string;
  author_id: string | null;
  category_id: string | null;
  featured_image_url: string | null;
  featured_image_alt_en: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  is_featured: boolean;
  read_time_minutes: number | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogArticleWithRelations extends BlogArticle {
  author: BlogAuthor | null;
  category: BlogCategory | null;
  translations: BlogTranslation[];
  tags?: BlogTag[];
}

export function pickTranslation(
  article: BlogArticleWithRelations,
  lang: BlogLang
): BlogTranslation | null {
  return (
    article.translations.find((t) => t.language === lang) ??
    article.translations.find((t) => t.language === "en") ??
    article.translations[0] ??
    null
  );
}

export function localizedCategoryName(c: BlogCategory, lang: BlogLang): string {
  if (lang === "pt") return c.name_pt || c.name_en;
  if (lang === "es") return c.name_es || c.name_en;
  return c.name_en;
}

export function localizedCategoryDesc(c: BlogCategory, lang: BlogLang): string {
  if (lang === "pt") return c.description_pt || c.description_en || "";
  if (lang === "es") return c.description_es || c.description_en || "";
  return c.description_en || "";
}

export function localizedAuthorBio(a: BlogAuthor, lang: BlogLang): string {
  if (lang === "pt") return a.bio_pt || a.bio_en || "";
  if (lang === "es") return a.bio_es || a.bio_en || "";
  return a.bio_en || "";
}

export function localizedTagName(t: BlogTag, lang: BlogLang): string {
  if (lang === "pt") return t.name_pt || t.name_en;
  if (lang === "es") return t.name_es || t.name_en;
  return t.name_en;
}

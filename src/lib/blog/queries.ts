import { supabase } from "@/integrations/supabase/client";
import type {
  BlogArticle,
  BlogArticleWithRelations,
  BlogAuthor,
  BlogCategory,
  BlogTag,
  BlogTranslation,
} from "./types";

const ARTICLE_BASE = `
  id, slug, author_id, category_id, featured_image_url, featured_image_alt_en,
  status, published_at, is_featured, read_time_minutes, view_count,
  created_at, updated_at
`;

const AUTHOR_FIELDS = `id, slug, name, role, bio_en, bio_pt, bio_es, avatar_url, linkedin_url, twitter_url, is_active`;
const CATEGORY_FIELDS = `id, slug, name_en, name_pt, name_es, description_en, description_pt, description_es, display_order, is_active`;
const TRANSLATION_FIELDS = `id, article_id, language, title, subtitle, excerpt, content_markdown, content_html, meta_title, meta_description, og_title, og_description, og_image_url, canonical_url, word_count`;

async function hydrateArticles(rows: any[]): Promise<BlogArticleWithRelations[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean)));
  const categoryIds = Array.from(new Set(rows.map((r) => r.category_id).filter(Boolean)));

  const [transRes, authRes, catRes] = await Promise.all([
    supabase.from("blog_article_translations").select(TRANSLATION_FIELDS).in("article_id", ids),
    authorIds.length
      ? supabase.from("blog_authors").select(AUTHOR_FIELDS).in("id", authorIds)
      : Promise.resolve({ data: [] as any[] }),
    categoryIds.length
      ? supabase.from("blog_categories").select(CATEGORY_FIELDS).in("id", categoryIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const translations = (transRes.data ?? []) as BlogTranslation[];
  const authors = (authRes.data ?? []) as BlogAuthor[];
  const categories = (catRes.data ?? []) as BlogCategory[];

  return rows.map((r) => ({
    ...(r as BlogArticle),
    author: authors.find((a) => a.id === r.author_id) ?? null,
    category: categories.find((c) => c.id === r.category_id) ?? null,
    translations: translations.filter((t) => t.article_id === r.id),
  }));
}

export async function listPublishedArticles(opts: {
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<BlogArticleWithRelations[]> {
  let q = supabase
    .from("blog_articles")
    .select(ARTICLE_BASE)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (opts.categorySlug) {
    const { data: cat } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (!cat) return [];
    q = q.eq("category_id", cat.id);
  }

  if (opts.authorSlug) {
    const { data: author } = await supabase
      .from("blog_authors")
      .select("id")
      .eq("slug", opts.authorSlug)
      .maybeSingle();
    if (!author) return [];
    q = q.eq("author_id", author.id);
  }

  if (opts.tagSlug) {
    const { data: tag } = await supabase
      .from("blog_tags")
      .select("id")
      .eq("slug", opts.tagSlug)
      .maybeSingle();
    if (!tag) return [];
    const { data: links } = await supabase
      .from("blog_article_tags")
      .select("article_id")
      .eq("tag_id", tag.id);
    const ids = (links ?? []).map((l) => l.article_id);
    if (!ids.length) return [];
    q = q.in("id", ids);
  }

  if (opts.limit) q = q.limit(opts.limit);
  if (opts.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 100) - 1);

  const { data, error } = await q;
  if (error || !data) return [];
  return hydrateArticles(data);
}

export async function getFeaturedArticle(): Promise<BlogArticleWithRelations | null> {
  const { data } = await supabase
    .from("blog_articles")
    .select(ARTICLE_BASE)
    .eq("status", "published")
    .eq("is_featured", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const [hydrated] = await hydrateArticles([data]);
  return hydrated ?? null;
}

export async function getArticleBySlug(slug: string): Promise<BlogArticleWithRelations | null> {
  const { data } = await supabase
    .from("blog_articles")
    .select(ARTICLE_BASE)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  const [hydrated] = await hydrateArticles([data]);
  if (!hydrated) return null;
  const { data: links } = await supabase
    .from("blog_article_tags")
    .select("tag_id, blog_tags(id, slug, name_en, name_pt, name_es)")
    .eq("article_id", hydrated.id);
  hydrated.tags = (links ?? [])
    .map((l: any) => l.blog_tags as BlogTag)
    .filter(Boolean);
  return hydrated;
}

export async function getRelatedArticles(
  article: BlogArticleWithRelations,
  limit = 3
): Promise<BlogArticleWithRelations[]> {
  if (!article.category_id) return [];
  const { data } = await supabase
    .from("blog_articles")
    .select(ARTICLE_BASE)
    .eq("status", "published")
    .eq("category_id", article.category_id)
    .neq("id", article.id)
    .order("published_at", { ascending: false })
    .limit(limit);
  return hydrateArticles(data ?? []);
}

export async function listCategories(): Promise<BlogCategory[]> {
  const { data } = await supabase
    .from("blog_categories")
    .select(CATEGORY_FIELDS)
    .eq("is_active", true)
    .order("display_order");
  return (data ?? []) as BlogCategory[];
}

export async function getCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const { data } = await supabase
    .from("blog_categories")
    .select(CATEGORY_FIELDS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as BlogCategory) ?? null;
}

export async function getAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  const { data } = await supabase
    .from("blog_authors")
    .select(AUTHOR_FIELDS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as BlogAuthor) ?? null;
}

export async function getTagBySlug(slug: string): Promise<BlogTag | null> {
  const { data } = await supabase
    .from("blog_tags")
    .select("id, slug, name_en, name_pt, name_es")
    .eq("slug", slug)
    .maybeSingle();
  return (data as BlogTag) ?? null;
}

export async function subscribeNewsletter(email: string, language: string, source: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "invalid_email" };
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: email.trim().toLowerCase(), language, source });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "already_subscribed" };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function incrementViewCount(id: string): Promise<void> {
  // Best-effort, RLS-friendly: only admins can update articles; for public views
  // we no-op silently. To allow public counts, add a SECURITY DEFINER RPC.
  await supabase.from("blog_articles").update({ view_count: 0 }).eq("id", id).select().maybeSingle().catch(() => {});
}

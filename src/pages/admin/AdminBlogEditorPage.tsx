import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { markdownToSafeHtml, countWords, estimateReadTime } from "@/lib/blog/markdown";
import type { BlogLang } from "@/lib/blog/types";

const LANGS: BlogLang[] = ["en", "pt", "es"];

interface ArticleRow {
  id: string;
  slug: string;
  status: string;
  is_featured: boolean;
  category_id: string | null;
  author_id: string | null;
  featured_image_url: string | null;
  featured_image_alt_en: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
}

interface TransRow {
  language: BlogLang;
  title: string;
  subtitle: string;
  excerpt: string;
  content_markdown: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
}

const emptyTrans = (language: BlogLang): TransRow => ({
  language,
  title: "",
  subtitle: "",
  excerpt: "",
  content_markdown: "",
  meta_title: "",
  meta_description: "",
  focus_keyword: "",
});

export default function AdminBlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [trans, setTrans] = useState<Record<BlogLang, TransRow>>({
    en: emptyTrans("en"),
    pt: emptyTrans("pt"),
    es: emptyTrans("es"),
  });
  const [activeLang, setActiveLang] = useState<BlogLang>("en");
  const [categories, setCategories] = useState<{ id: string; name_en: string }[]>([]);
  const [authors, setAuthors] = useState<{ id: string; name: string }[]>([]);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [aRes, tRes, cRes, auRes] = await Promise.all([
        supabase.from("blog_articles").select("*").eq("id", id).maybeSingle(),
        supabase.from("blog_article_translations").select("*").eq("article_id", id),
        supabase.from("blog_categories").select("id, name_en").order("display_order"),
        supabase.from("blog_authors").select("id, name").eq("is_active", true),
      ]);
      if (aRes.data) setArticle(aRes.data as ArticleRow);
      const next: Record<BlogLang, TransRow> = {
        en: emptyTrans("en"),
        pt: emptyTrans("pt"),
        es: emptyTrans("es"),
      };
      (tRes.data ?? []).forEach((t: any) => {
        if (LANGS.includes(t.language)) {
          next[t.language as BlogLang] = {
            language: t.language,
            title: t.title ?? "",
            subtitle: t.subtitle ?? "",
            excerpt: t.excerpt ?? "",
            content_markdown: t.content_markdown ?? "",
            meta_title: t.meta_title ?? "",
            meta_description: t.meta_description ?? "",
            focus_keyword: t.focus_keyword ?? "",
          };
        }
      });
      setTrans(next);
      setCategories((cRes.data ?? []) as any);
      setAuthors((auRes.data ?? []) as any);
      setLoading(false);
    })();
  }, [id]);

  function patchArticle(patch: Partial<ArticleRow>) {
    setArticle((a) => (a ? { ...a, ...patch } : a));
    scheduleSave();
  }
  function patchTrans(lang: BlogLang, patch: Partial<TransRow>) {
    setTrans((s) => ({ ...s, [lang]: { ...s[lang], ...patch } }));
    scheduleSave();
  }

  function scheduleSave() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => save(), 1500);
  }

  async function save() {
    if (!article) return;
    const readTime = estimateReadTime(trans.en.content_markdown || trans.pt.content_markdown || trans.es.content_markdown);
    const articlePatch = {
      slug: article.slug,
      status: article.status,
      is_featured: article.is_featured,
      category_id: article.category_id,
      author_id: article.author_id,
      featured_image_url: article.featured_image_url,
      featured_image_alt_en: article.featured_image_alt_en,
      read_time_minutes: readTime,
      published_at:
        article.status === "published" && !article.published_at
          ? new Date().toISOString()
          : article.published_at,
    };
    const { error: aErr } = await supabase.from("blog_articles").update(articlePatch).eq("id", article.id);
    if (aErr) {
      console.error(aErr);
      return;
    }
    if (articlePatch.published_at !== article.published_at) {
      setArticle((a) => (a ? { ...a, published_at: articlePatch.published_at } : a));
    }

    for (const lang of LANGS) {
      const t = trans[lang];
      const hasContent = t.title || t.content_markdown;
      if (!hasContent) continue;
      const html = markdownToSafeHtml(t.content_markdown);
      const payload = {
        article_id: article.id,
        language: lang,
        title: t.title,
        subtitle: t.subtitle || null,
        excerpt: t.excerpt || null,
        content_markdown: t.content_markdown || null,
        content_html: html || null,
        meta_title: t.meta_title || null,
        meta_description: t.meta_description || null,
        focus_keyword: t.focus_keyword || null,
        word_count: countWords(t.content_markdown),
      };
      const { data: existing } = await supabase
        .from("blog_article_translations")
        .select("id")
        .eq("article_id", article.id)
        .eq("language", lang)
        .maybeSingle();
      if (existing) {
        await supabase.from("blog_article_translations").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("blog_article_translations").insert(payload);
      }
    }
    setSavedAt(new Date());
  }

  async function uploadImage(file: File) {
    if (!article) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${article.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file, { upsert: true });
    if (error) {
      alert(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    patchArticle({ featured_image_url: data.publicUrl });
    setUploading(false);
  }
  const t = trans[activeLang];
  const previewHtml = useMemo(() => markdownToSafeHtml(t.content_markdown), [t.content_markdown]);

  if (loading || !article) {
    return (
      <AdminLayout>
        <div className="p-6 opacity-60">Loading…</div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/admin/blog" className="text-xs opacity-60 underline">← All articles</Link>
            <h1 className="text-2xl font-semibold mt-2">Edit article</h1>
          </div>
          <div className="flex items-center gap-3 text-xs opacity-60">
            {savedAt && <span>Saved {savedAt.toLocaleTimeString()}</span>}
            <Button onClick={save} size="sm">Save now</Button>
          </div>
        </div>

        {/* Article settings */}
        <div className="grid md:grid-cols-2 gap-6 mb-6 p-4 border rounded-lg">
          <div>
            <Label className="text-xs">Slug</Label>
            <Input value={article.slug} onChange={(e) => patchArticle({ slug: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <select
              value={article.status}
              onChange={(e) => patchArticle({ status: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <select
              value={article.category_id ?? ""}
              onChange={(e) => patchArticle({ category_id: e.target.value || null })}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Author</Label>
            <select
              value={article.author_id ?? ""}
              onChange={(e) => patchArticle({ author_id: e.target.value || null })}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">—</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Featured image</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              />
              {uploading && <span className="text-xs opacity-60">Uploading…</span>}
            </div>
            {article.featured_image_url && (
              <img src={article.featured_image_url} alt="" className="mt-3 h-32 rounded object-cover" />
            )}
            <Input
              className="mt-2"
              placeholder="Image alt text (EN)"
              value={article.featured_image_alt_en ?? ""}
              onChange={(e) => patchArticle({ featured_image_alt_en: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="feat"
              type="checkbox"
              checked={article.is_featured}
              onChange={(e) => patchArticle({ is_featured: e.target.checked })}
            />
            <Label htmlFor="feat" className="text-xs">Featured on homepage</Label>
          </div>
          <div className="text-xs opacity-60 self-end">
            Read time: {estimateReadTime(trans.en.content_markdown)} min · {countWords(trans.en.content_markdown)} words
          </div>
        </div>

        {/* Translations */}
        <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as BlogLang)}>
          <TabsList>
            {LANGS.map((l) => (
              <TabsTrigger key={l} value={l}>{l.toUpperCase()}</TabsTrigger>
            ))}
          </TabsList>

          {LANGS.map((l) => (
            <TabsContent key={l} value={l} className="space-y-4 mt-4">
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={trans[l].title} onChange={(e) => patchTrans(l, { title: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Subtitle</Label>
                <Input value={trans[l].subtitle} onChange={(e) => patchTrans(l, { subtitle: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Excerpt</Label>
                <Textarea rows={2} value={trans[l].excerpt} onChange={(e) => patchTrans(l, { excerpt: e.target.value })} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Meta title (SEO)</Label>
                  <Input value={trans[l].meta_title} onChange={(e) => patchTrans(l, { meta_title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Meta description (SEO)</Label>
                  <Input value={trans[l].meta_description} onChange={(e) => patchTrans(l, { meta_description: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Focus keyword (SEO)</Label>
                <Input
                  value={trans[l].focus_keyword}
                  placeholder="e.g. teleconsulta médica"
                  onChange={(e) => patchTrans(l, { focus_keyword: e.target.value })}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Primary search term this article targets. Used in Schema.org keywords + internal SEO audits.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Markdown</Label>
                  <Textarea
                    rows={28}
                    className="font-mono text-sm"
                    value={trans[l].content_markdown}
                    onChange={(e) => patchTrans(l, { content_markdown: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Live preview</Label>
                  <div
                    className="prose prose-sm max-w-none border rounded-md p-4 overflow-auto"
                    style={{ minHeight: "600px" }}
                    dangerouslySetInnerHTML={{ __html: l === activeLang ? previewHtml : markdownToSafeHtml(trans[l].content_markdown) }}
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}

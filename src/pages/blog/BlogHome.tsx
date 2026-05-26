import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlogSEO, { SITE_URL } from "@/components/blog/BlogSEO";
import { listPublishedArticles, getFeaturedArticle, listCategories } from "@/lib/blog/queries";
import type { BlogArticleWithRelations, BlogCategory } from "@/lib/blog/types";
import { pickTranslation, localizedCategoryName } from "@/lib/blog/types";
import { detectInitialLang, persistLang, BLOG_LANGS, langLabel } from "@/lib/blog/locale";
import type { BlogLang } from "@/lib/blog/types";

export default function BlogHome() {
  const [lang, setLang] = useState<BlogLang>(detectInitialLang());
  const [featured, setFeatured] = useState<BlogArticleWithRelations | null>(null);
  const [articles, setArticles] = useState<BlogArticleWithRelations[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [f, list, cats] = await Promise.all([
        getFeaturedArticle(),
        listPublishedArticles({ limit: 12, categorySlug: activeCat ?? undefined }),
        listCategories(),
      ]);
      if (!alive) return;
      setFeatured(f);
      setArticles(list);
      setCategories(cats);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [activeCat]);

  const heroTitle = lang === "pt" ? "Onde a saúde encontra o lugar." : lang === "es" ? "Donde la salud encuentra el lugar." : "Where healthcare meets place.";
  const heroSub = lang === "pt"
    ? "Ensaios, pesquisas e notas de campo da fronteira do Turismo de Santuário de Saúde."
    : lang === "es"
    ? "Ensayos, investigación y notas de campo de la frontera del Turismo de Santuario de Salud."
    : "Essays, research, and field notes from the frontier of Health Sanctuary Tourism.";

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
      <BlogSEO
        title="SalbCare Journal"
        description={heroSub}
        canonicalPath="/blog"
        hreflangPath="/blog"
        lang={lang}
        ogType="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "SalbCare Journal",
          url: `${SITE_URL}/blog`,
          inLanguage: lang,
        }}
      />

      {/* Hero */}
      <section className="px-6 md:px-12 pt-24 pb-16 md:pt-32 md:pb-24 text-center max-w-4xl mx-auto">
        <p className="text-xs tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(var(--kite-gold))" }}>
          The SalbCare Journal
        </p>
        <h1 className="text-4xl md:text-6xl font-serif leading-tight mb-6" style={{ letterSpacing: "-0.01em" }}>
          {heroTitle}
        </h1>
        <p className="text-base md:text-lg opacity-80 max-w-2xl mx-auto">{heroSub}</p>

        {/* Language switcher */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs">
          {BLOG_LANGS.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); persistLang(l); }}
              className={`px-3 py-1 rounded-full border transition-colors ${
                lang === l ? "border-[hsl(var(--kite-gold))] text-[hsl(var(--kite-gold))]" : "border-white/15 text-white/70 hover:text-white"
              }`}
            >
              {langLabel(l)}
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured && (() => {
        const t = pickTranslation(featured, lang);
        if (!t) return null;
        return (
          <section className="px-6 md:px-12 max-w-6xl mx-auto mb-16">
            <Link to={`/blog/${featured.slug}`} className="block group">
              <div className="grid md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden" style={{ background: "hsl(var(--brand-darker))" }}>
                {featured.featured_image_url && (
                  <img
                    src={featured.featured_image_url}
                    alt={featured.featured_image_alt_en || t.title}
                    className="w-full h-64 md:h-96 object-cover"
                    loading="eager"
                  />
                )}
                <div className="p-8">
                  {featured.category && (
                    <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "hsl(var(--kite-gold))" }}>
                      {localizedCategoryName(featured.category, lang)}
                    </p>
                  )}
                  <h2 className="font-serif text-2xl md:text-3xl mb-3 group-hover:opacity-90">{t.title}</h2>
                  {t.excerpt && <p className="opacity-70 mb-4">{t.excerpt}</p>}
                  <p className="text-xs opacity-50">
                    {featured.author?.name}{featured.author?.role ? ` · ${featured.author.role}` : ""}
                    {featured.read_time_minutes ? ` · ${featured.read_time_minutes} min` : ""}
                  </p>
                </div>
              </div>
            </Link>
          </section>
        );
      })()}

      {/* Category nav */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto mb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveCat(null)}
            className={`px-4 py-2 text-xs rounded-full border ${activeCat === null ? "border-[hsl(var(--kite-gold))] text-[hsl(var(--kite-gold))]" : "border-white/15 text-white/70"}`}
          >
            {lang === "pt" ? "Todos" : lang === "es" ? "Todos" : "All"}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.slug)}
              className={`px-4 py-2 text-xs rounded-full border ${activeCat === c.slug ? "border-[hsl(var(--kite-gold))] text-[hsl(var(--kite-gold))]" : "border-white/15 text-white/70"}`}
            >
              {localizedCategoryName(c, lang)}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto pb-24">
        {loading ? (
          <p className="text-center opacity-50">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="text-center opacity-50">
            {lang === "pt" ? "Em breve, os primeiros ensaios." : lang === "es" ? "Pronto, los primeros ensayos." : "First essays coming soon."}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((a) => {
              const t = pickTranslation(a, lang);
              if (!t) return null;
              return (
                <Link key={a.id} to={`/blog/${a.slug}`} className="block group">
                  {a.featured_image_url && (
                    <img src={a.featured_image_url} alt={t.title} loading="lazy" className="w-full h-48 object-cover rounded-lg mb-4" />
                  )}
                  {a.category && (
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "hsl(var(--kite-gold))" }}>
                      {localizedCategoryName(a.category, lang)}
                    </p>
                  )}
                  <h3 className="font-serif text-xl mb-2 group-hover:opacity-90">{t.title}</h3>
                  {t.excerpt && <p className="text-sm opacity-70 line-clamp-3 mb-3">{t.excerpt}</p>}
                  <p className="text-xs opacity-50">
                    {a.author?.name}{a.read_time_minutes ? ` · ${a.read_time_minutes} min` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

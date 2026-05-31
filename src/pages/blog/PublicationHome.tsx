import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlogSEO, { SITE_URL } from "@/components/blog/BlogSEO";
import NewsletterInline from "@/components/blog/NewsletterInline";
import { getFeaturedArticle, getPublicationBySlug, listCategories, listPublishedArticles } from "@/lib/blog/queries";
import {
  pickTranslation,
  localizedCategoryName,
  localizedPublicationName,
  localizedPublicationDesc,
  type BlogArticleWithRelations,
  type BlogCategory,
  type BlogLang,
  type BlogPublication,
  type PublicationSlug,
} from "@/lib/blog/types";
import { detectInitialLang, persistLang, BLOG_LANGS, langLabel, withLangPrefix, pubUrlSegment } from "@/lib/blog/locale";

interface Props { publication: PublicationSlug; }

export default function PublicationHome({ publication }: Props) {
  const [lang, setLang] = useState<BlogLang>(detectInitialLang());
  const [pub, setPub] = useState<BlogPublication | null>(null);
  const [featured, setFeatured] = useState<BlogArticleWithRelations | null>(null);
  const [articles, setArticles] = useState<BlogArticleWithRelations[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, f, list, cats] = await Promise.all([
        getPublicationBySlug(publication),
        getFeaturedArticle(publication),
        listPublishedArticles({ publicationSlug: publication, limit: 12, categorySlug: activeCat ?? undefined }),
        listCategories(publication),
      ]);
      setPub(p);
      setFeatured(f);
      setArticles(list);
      setCategories(cats);
      setLoading(false);
    })();
  }, [publication, activeCat]);

  const accentVar = publication === "pro" ? "--blog-pro" : "--blog-journal";
  const titleClass = publication === "journal" ? "font-journal italic" : "font-pro font-bold";
  const name = pub ? localizedPublicationName(pub, lang) : "";
  const desc = pub ? localizedPublicationDesc(pub, lang) : "";

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
      <BlogSEO
        title={name || (publication === "pro" ? "SalbCare Pro Blog" : "The SalbCare Journal")}
        description={desc}
        canonicalPath={withLangPrefix(`/journal/${pubUrlSegment(publication)}`, lang)}
        hreflangPath={`/journal/${pubUrlSegment(publication)}`}
        lang={lang}
        ogType="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name,
          url: `${SITE_URL}/blog/${publication}`,
          inLanguage: lang,
        }}
      />

      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs">
          <nav className="opacity-70">
            <Link to={withLangPrefix("/journal", lang)} className="hover:opacity-100">Journal</Link>
            <span className="mx-2 opacity-40">/</span>
            <span style={{ color: `hsl(var(${accentVar}))` }}>{publication === "pro" ? "Pro" : "Journal"}</span>
          </nav>
          <div className="flex gap-1">
            {BLOG_LANGS.map((l) => (
              <button key={l} onClick={() => { setLang(l); persistLang(l); }}
                className={`px-2 py-1 rounded ${lang === l ? "text-white" : "opacity-60 hover:opacity-100"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-[10px] tracking-[0.25em] uppercase mb-5" style={{ color: `hsl(var(${accentVar}))` }}>
          {publication === "pro" ? "SALBCARE PRO BLOG" : "THE SALBCARE JOURNAL"}
        </p>
        <h1 className={`text-4xl md:text-5xl mb-5 ${titleClass}`} style={{ letterSpacing: "-0.01em" }}>
          {name}
        </h1>
        <p className="opacity-75 max-w-2xl mx-auto">{desc}</p>
      </section>

      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mb-10">
          <div className="flex flex-wrap gap-2 justify-center">
            <CatPill active={activeCat === null} accentVar={accentVar} onClick={() => setActiveCat(null)}>
              {lang === "pt" ? "Todos" : lang === "es" ? "Todos" : "All"}
            </CatPill>
            {categories.map((c) => (
              <CatPill key={c.id} active={activeCat === c.slug} accentVar={accentVar} onClick={() => setActiveCat(c.slug)}>
                {localizedCategoryName(c, lang)}
              </CatPill>
            ))}
          </div>
        </section>
      )}

      {featured && (() => {
        const t = pickTranslation(featured, lang);
        if (!t) return null;
        return (
          <section className="max-w-6xl mx-auto px-6 mb-16">
            <Link to={withLangPrefix(`/journal/${pubUrlSegment(publication)}/${featured.slug}`, lang)} className="block group">
              <div className="grid md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden" style={{ background: "hsl(var(--brand-darker))" }}>
                {featured.featured_image_url && (
                  <img src={featured.featured_image_url} alt={featured.featured_image_alt_en || t.title}
                    className="w-full h-64 md:h-96 object-cover" loading="eager" />
                )}
                <div className="p-8">
                  {featured.category && (
                    <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: `hsl(var(${accentVar}))` }}>
                      {localizedCategoryName(featured.category, lang)}
                    </p>
                  )}
                  <h2 className={`text-2xl md:text-3xl mb-3 group-hover:opacity-90 ${publication === "journal" ? "font-journal" : "font-pro font-semibold"}`}>{t.title}</h2>
                  {t.excerpt && <p className="opacity-70 mb-4">{t.excerpt}</p>}
                  <p className="text-xs opacity-50">
                    {featured.author?.name}{featured.read_time_minutes ? ` · ${featured.read_time_minutes} min` : ""}
                  </p>
                </div>
              </div>
            </Link>
          </section>
        );
      })()}

      <section className="max-w-6xl mx-auto px-6 pb-16">
        {loading ? (
          <p className="text-center opacity-50">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="text-center opacity-50">
            {lang === "pt" ? "Em breve, os primeiros artigos." : lang === "es" ? "Pronto, los primeros artículos." : "First articles coming soon."}
          </p>
        ) : (
          <div className={`grid gap-8 ${publication === "journal" ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
            {articles.map((a) => {
              const t = pickTranslation(a, lang);
              if (!t) return null;
              return (
                <Link key={a.id} to={withLangPrefix(`/journal/${pubUrlSegment(publication)}/${a.slug}`, lang)} className="block group">
                  {a.featured_image_url && (
                    <img src={a.featured_image_url} alt={t.title} loading="lazy"
                      className={`w-full ${publication === "journal" ? "h-56" : "h-48"} object-cover rounded-lg mb-4`} />
                  )}
                  {a.category && (
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: `hsl(var(${accentVar}))` }}>
                      {localizedCategoryName(a.category, lang)}
                    </p>
                  )}
                  <h3 className={`text-xl mb-2 group-hover:opacity-90 ${publication === "journal" ? "font-journal" : "font-pro font-semibold"}`}>{t.title}</h3>
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

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <NewsletterInline publication={publication} lang={lang} source={`/journal/${pubUrlSegment(publication)}`} />
      </section>
    </div>
  );
}

function CatPill({ active, accentVar, children, onClick }: { active: boolean; accentVar: string; children: React.ReactNode; onClick: () => void; }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-xs rounded-full border transition-colors ${active ? "text-white" : "text-white/60 border-white/15"}`}
      style={active ? { borderColor: `hsl(var(${accentVar}))`, color: `hsl(var(${accentVar}))` } : undefined}
    >
      {children}
    </button>
  );
}

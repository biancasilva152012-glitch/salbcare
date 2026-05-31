import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BlogSEO, { SITE_URL } from "@/components/blog/BlogSEO";
import { getAuthorBySlug, listPublishedArticles } from "@/lib/blog/queries";
import {
  pickTranslation,
  localizedAuthorBio,
  localizedPublicationName,
  type BlogArticleWithRelations,
  type BlogAuthor,
  type BlogLang,
  type PublicationSlug,
} from "@/lib/blog/types";
import { detectInitialLang, persistLang, BLOG_LANGS, withLangPrefix, pubUrlSegment } from "@/lib/blog/locale";

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lang, setLang] = useState<BlogLang>(detectInitialLang());
  const [author, setAuthor] = useState<BlogAuthor | null>(null);
  const [articles, setArticles] = useState<BlogArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const a = await getAuthorBySlug(slug);
      if (!alive) return;
      if (!a) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setAuthor(a);
      const list = await listPublishedArticles({ authorSlug: slug, limit: 50 });
      if (!alive) return;
      setArticles(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
        <div className="text-center px-6">
          <h1 className="font-serif text-3xl mb-4">Author not found</h1>
          <Link to={withLangPrefix("/journal", lang)} className="underline opacity-80">Back to the Journal</Link>
        </div>
      </div>
    );
  }

  if (loading || !author) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
        <p className="opacity-50 text-sm">Loading…</p>
      </div>
    );
  }

  const grouped: Record<PublicationSlug, BlogArticleWithRelations[]> = { pro: [], journal: [] };
  for (const a of articles) {
    const pub = a.publication?.slug as PublicationSlug | undefined;
    if (pub && grouped[pub]) grouped[pub].push(a);
  }

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: localizedAuthorBio(author, lang) || undefined,
    image: author.avatar_url || undefined,
    sameAs: [author.linkedin_url, author.twitter_url].filter(Boolean),
    url: `${SITE_URL}${withLangPrefix(`/journal/author/${author.slug}`, lang)}`,
    jobTitle: author.role || undefined,
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
      <BlogSEO
        title={`${author.name} — SalbCare`}
        description={localizedAuthorBio(author, lang) || `${author.name}, ${author.role ?? "Author"} at SalbCare.`}
        canonicalPath={withLangPrefix(`/journal/author/${author.slug}`, lang)}
        hreflangPath={`/journal/author/${author.slug}`}
        lang={lang}
        ogType="website"
        ogImage={author.avatar_url}
        jsonLd={personLd}
      />

      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-xs">
          <Link to={withLangPrefix("/journal", lang)} className="opacity-70 hover:opacity-100 tracking-wider uppercase">
            ← Blog
          </Link>
          <div className="flex gap-2">
            {BLOG_LANGS.map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); persistLang(l); }}
                className={`px-2 py-1 rounded ${lang === l ? "text-white" : "opacity-60 hover:opacity-100"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <header className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        {author.avatar_url && (
          <img src={author.avatar_url} alt={author.name} className="w-24 h-24 rounded-full mx-auto mb-6 object-cover" />
        )}
        <h1 className="font-serif text-4xl md:text-5xl mb-3">{author.name}</h1>
        {author.role && <p className="text-sm opacity-70 mb-6 uppercase tracking-wider">{author.role}</p>}
        {localizedAuthorBio(author, lang) && (
          <p className="opacity-80 max-w-2xl mx-auto leading-relaxed">{localizedAuthorBio(author, lang)}</p>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-16">
        {(["pro", "journal"] as PublicationSlug[]).map((pub) => {
          const list = grouped[pub];
          if (!list.length) return null;
          const accentVar = pub === "pro" ? "--blog-pro" : "--blog-journal";
          const pubName = list[0].publication
            ? localizedPublicationName(list[0].publication, lang)
            : pub === "pro" ? "SalbCare Pro" : "The SalbCare Journal";
          return (
            <section key={pub}>
              <div className="flex items-baseline justify-between mb-6">
                <h2 className={`text-2xl ${pub === "journal" ? "font-journal italic" : "font-pro font-semibold"}`}>
                  {pubName}
                </h2>
                <Link
                  to={withLangPrefix(`/journal/${pubUrlSegment(pub)}`, lang)}
                  className="text-xs uppercase tracking-wider hover:opacity-80"
                  style={{ color: `hsl(var(${accentVar}))` }}
                >
                  {lang === "pt" ? "Ver tudo →" : lang === "es" ? "Ver todo →" : "View all →"}
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {list.map((a) => {
                  const t = pickTranslation(a, lang);
                  if (!t) return null;
                  return (
                    <Link key={a.id} to={withLangPrefix(`/journal/${pubUrlSegment(pub)}/${a.slug}`, lang)} className="block group">
                      {a.featured_image_url && (
                        <img src={a.featured_image_url} alt={t.title} loading="lazy"
                          className="w-full h-44 object-cover rounded-lg mb-3" />
                      )}
                      <h3 className={`text-lg mb-2 group-hover:opacity-90 ${pub === "journal" ? "font-journal" : "font-pro font-semibold"}`}>
                        {t.title}
                      </h3>
                      {t.excerpt && <p className="text-sm opacity-70 line-clamp-2">{t.excerpt}</p>}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
        {articles.length === 0 && (
          <p className="text-center opacity-50">
            {lang === "pt" ? "Sem artigos publicados ainda." : lang === "es" ? "Aún no hay artículos publicados." : "No published articles yet."}
          </p>
        )}
      </div>
    </div>
  );
}

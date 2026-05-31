import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import BlogSEO, { SITE_URL } from "@/components/blog/BlogSEO";
import BlogMarkdownContent from "@/components/blog/BlogMarkdownContent";
import { getArticleBySlug, getRelatedArticles, subscribeNewsletter } from "@/lib/blog/queries";
import {
  pickTranslation,
  localizedCategoryName,
  localizedAuthorBio,
  localizedTagName,
  type BlogArticleWithRelations,
  type BlogLang,
  type PublicationSlug,
} from "@/lib/blog/types";
import { detectInitialLang, persistLang, BLOG_LANGS, withLangPrefix, pubUrlSegment } from "@/lib/blog/locale";
import { markdownToSafeHtml } from "@/lib/blog/markdown";

interface Props {
  forcedLang?: BlogLang;
  publicationSlug?: PublicationSlug;
}

export default function BlogArticle({ forcedLang, publicationSlug }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [lang, setLang] = useState<BlogLang>(forcedLang ?? detectInitialLang());
  const [article, setArticle] = useState<BlogArticleWithRelations | null>(null);
  const [related, setRelated] = useState<BlogArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "ok" | "dup" | "err">("idle");

  useEffect(() => {
    if (forcedLang) setLang(forcedLang);
  }, [forcedLang]);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const a = await getArticleBySlug(slug, publicationSlug);
      if (!alive) return;
      if (!a) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setArticle(a);
      setLoading(false);
      const r = await getRelatedArticles(a, 3);
      if (alive) setRelated(r);
    })();
    return () => {
      alive = false;
    };
  }, [slug, publicationSlug]);

  // Resolve actual publication (from prop or from loaded article)
  const pub: PublicationSlug | undefined =
    publicationSlug ?? (article?.publication?.slug as PublicationSlug | undefined);
  const isJournal = pub === "journal";
  const accentVar = isJournal ? "--blog-journal" : "--blog-pro";
  const headingClass = isJournal ? "font-journal italic" : "font-pro font-bold";
  const variant: "pro" | "journal" = isJournal ? "journal" : "pro";
  const bgVar = isJournal ? "--brand-dark" : "--brand-dark";

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
        <div className="text-center px-6">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: `hsl(var(${accentVar}))` }}>404</p>
          <h1 className="font-serif text-3xl mb-4">Article not found</h1>
          <Link to={withLangPrefix(pub ? `/journal/${pubUrlSegment(pub)}` : "/journal", lang)} className="underline opacity-80">Back to the Journal</Link>
        </div>
      </div>
    );
  }

  if (loading || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
        <p className="opacity-50 text-sm">Loading…</p>
      </div>
    );
  }

  const t = pickTranslation(article, lang);
  if (!t) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
        <p className="opacity-50 text-sm">No translation available.</p>
      </div>
    );
  }

  const articlePub = (article.publication?.slug as PublicationSlug | undefined) ?? pub ?? "journal";
  const html = t.content_html?.trim()
    ? t.content_html
    : markdownToSafeHtml(t.content_markdown || "");

  const pubDate = article.published_at || article.created_at;
  const canonicalPath = `/journal/${pubUrlSegment(articlePub)}/${article.slug}`;
  const canonical = t.canonical_url || withLangPrefix(canonicalPath, lang);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubStatus("idle");
    const res = await subscribeNewsletter(
      email,
      lang,
      `blog_article_${articlePub}`,
      articlePub === "pro" ? "pro" : "journal",
    );
    if (res.ok) {
      setSubStatus("ok");
      setEmail("");
    } else if (res.error === "already_subscribed") {
      setSubStatus("dup");
    } else {
      setSubStatus("err");
    }
  }

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t.title,
    description: t.meta_description || t.excerpt || undefined,
    image: article.featured_image_url || undefined,
    datePublished: pubDate,
    dateModified: article.updated_at,
    inLanguage: lang,
    keywords: t.focus_keyword || undefined,
    author: article.author
      ? { "@type": "Person", name: article.author.name, url: `${SITE_URL}${withLangPrefix(`/journal/author/${article.author.slug}`, lang)}` }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "SalbCare",
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${canonical}` },
    wordCount: t.word_count || undefined,
  };

  const pubLabel = articlePub === "pro" ? "SalbCare Pro" : "The SalbCare Journal";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Journal", item: `${SITE_URL}${withLangPrefix("/journal", lang)}` },
      { "@type": "ListItem", position: 2, name: pubLabel, item: `${SITE_URL}${withLangPrefix(`/journal/${pubUrlSegment(articlePub)}`, lang)}` },
      ...(article.category
        ? [{
            "@type": "ListItem",
            position: 3,
            name: localizedCategoryName(article.category, lang),
            item: `${SITE_URL}${withLangPrefix(`/journal/${pubUrlSegment(articlePub)}?cat=${article.category.slug}`, lang)}`,
          }]
        : []),
      { "@type": "ListItem", position: article.category ? 4 : 3, name: t.title, item: `${SITE_URL}${canonical}` },
    ],
  };

  return (
    <div className="min-h-screen" style={{ background: `hsl(var(${bgVar}))`, color: "hsl(var(--kite-cream))" }}>
      <BlogSEO
        title={t.meta_title || t.title}
        description={t.meta_description || t.excerpt || ""}
        canonicalPath={canonical}
        hreflangPath={canonicalPath}
        lang={lang}
        ogImage={t.og_image_url || article.featured_image_url}
        ogType="article"
        jsonLd={[articleLd, breadcrumbLd]}
      />

      {/* Top bar */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-xs">
          <Link to={withLangPrefix(`/journal/${pubUrlSegment(articlePub)}`, lang)} className="opacity-70 hover:opacity-100 tracking-wider uppercase">
            ← {pubLabel}
          </Link>
          <div className="flex gap-2">
            {BLOG_LANGS.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  persistLang(l);
                  if (forcedLang) navigate(withLangPrefix(`/journal/${pubUrlSegment(articlePub)}/${article.slug}`, l));
                }}
                className={`px-2 py-1 rounded ${lang === l ? "" : "opacity-60 hover:opacity-100"}`}
                style={lang === l ? { color: `hsl(var(${accentVar}))` } : undefined}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <article className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <header className="mb-12">
          {article.category && (
            <p className="text-[10px] uppercase tracking-[0.2em] mb-6" style={{ color: `hsl(var(${accentVar}))` }}>
              {localizedCategoryName(article.category, lang)}
            </p>
          )}
          <h1 className={`text-3xl md:text-5xl leading-tight mb-6 ${headingClass}`} style={{ letterSpacing: "-0.01em" }}>
            {t.title}
          </h1>
          {t.subtitle && <p className="text-lg md:text-xl opacity-75 mb-8 leading-relaxed">{t.subtitle}</p>}

          <div className="flex flex-wrap items-center gap-3 text-xs opacity-60">
            {article.author && (
              <span>
                By{" "}
                <Link to={withLangPrefix(`/journal/author/${article.author.slug}`, lang)} className="underline hover:text-[hsl(var(--kite-gold))]">
                  {article.author.name}
                </Link>
              </span>
            )}
            {pubDate && (
              <span>
                · <time dateTime={pubDate}>{new Date(pubDate).toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
              </span>
            )}
            {article.read_time_minutes && <span>· {article.read_time_minutes} min read</span>}
          </div>
        </header>

        {article.featured_image_url && (
          <figure className="mb-12 -mx-6 md:mx-0">
            <img
              src={article.featured_image_url}
              alt={article.featured_image_alt_en || t.title}
              className="w-full h-auto md:rounded-lg"
              loading="eager"
            />
          </figure>
        )}

        <BlogMarkdownContent html={html} variant={variant} />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-widest opacity-50 mb-4">Tagged</p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={withLangPrefix(`/journal/tag/${tag.slug}`, lang)}
                  className="text-xs px-3 py-1 rounded-full border border-white/15"
                  style={{ borderColor: undefined }}
                >
                  {localizedTagName(tag, lang)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author bio */}
        {article.author && (
          <aside className="mt-16 pt-8 border-t border-white/10 flex gap-4 items-start">
            {article.author.avatar_url && (
              <img src={article.author.avatar_url} alt={article.author.name} className="w-14 h-14 rounded-full object-cover" />
            )}
            <div>
              <Link
                to={withLangPrefix(`/journal/author/${article.author.slug}`, lang)}
                className={`${isJournal ? "font-journal italic" : "font-pro font-semibold"} text-lg hover:underline`}
              >
                {article.author.name}
              </Link>
              {article.author.role && <p className="text-xs opacity-60 mb-2">{article.author.role}</p>}
              <p className="text-sm opacity-75 leading-relaxed">{localizedAuthorBio(article.author, lang)}</p>
            </div>
          </aside>
        )}

        {/* Newsletter */}
        <aside className="mt-16 p-8 rounded-2xl" style={{ background: "hsl(var(--brand-darker))" }}>
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: `hsl(var(${accentVar}))` }}>
            {articlePub === "pro"
              ? (lang === "pt" ? "Newsletter SalbCare Pro" : lang === "es" ? "Newsletter SalbCare Pro" : "SalbCare Pro newsletter")
              : (lang === "pt" ? "Assine o Journal" : lang === "es" ? "Suscríbete al Journal" : "Subscribe to the Journal")}
          </p>
          <h3 className={`text-2xl mb-4 ${isJournal ? "font-journal" : "font-pro font-semibold"}`}>
            {articlePub === "pro"
              ? (lang === "pt" ? "Insights práticos para seu consultório."
                 : lang === "es" ? "Insights prácticos para tu consultorio."
                 : "Practical insights for your practice.")
              : (lang === "pt" ? "Pesquisa de campo. Sem ruído."
                 : lang === "es" ? "Investigación de campo. Sin ruido."
                 : "Field research. No noise.")}
          </h3>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={lang === "pt" ? "Seu email" : lang === "es" ? "Tu correo" : "Your email"}
              className="flex-1 bg-transparent border border-white/20 rounded-md px-4 py-3 text-sm focus:outline-none"
              style={{ borderColor: undefined }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm rounded-md font-medium"
              style={{ background: `hsl(var(${accentVar}))`, color: "hsl(var(--brand-dark))" }}
            >
              {lang === "pt" ? "Assinar" : lang === "es" ? "Suscribirme" : "Subscribe"}
            </button>
          </form>
          {subStatus === "ok" && <p className="text-xs mt-3 opacity-70">✓ {lang === "pt" ? "Confirmado." : lang === "es" ? "Confirmado." : "You're in."}</p>}
          {subStatus === "dup" && <p className="text-xs mt-3 opacity-70">{lang === "pt" ? "Você já assina." : lang === "es" ? "Ya estás suscrito." : "You're already subscribed."}</p>}
          {subStatus === "err" && <p className="text-xs mt-3 opacity-70">{lang === "pt" ? "Erro. Tente novamente." : lang === "es" ? "Error. Intenta de nuevo." : "Something went wrong."}</p>}
        </aside>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-white/10 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-[10px] uppercase tracking-widest mb-8 opacity-60">
              {lang === "pt" ? "Continue lendo" : lang === "es" ? "Sigue leyendo" : "Keep reading"}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {related.map((r) => {
                const rt = pickTranslation(r, lang);
                if (!rt) return null;
                const rpub = (r.publication?.slug as PublicationSlug | undefined) ?? articlePub;
                return (
                  <Link key={r.id} to={withLangPrefix(`/journal/${pubUrlSegment(rpub)}/${r.slug}`, lang)} className="group">
                    {r.featured_image_url && (
                      <img src={r.featured_image_url} alt={rt.title} loading="lazy" className="w-full h-40 object-cover rounded-md mb-4" />
                    )}
                    <h4 className={`text-lg mb-2 group-hover:opacity-80 ${isJournal ? "font-journal" : "font-pro font-semibold"}`}>{rt.title}</h4>
                    {rt.excerpt && <p className="text-sm opacity-60 line-clamp-2">{rt.excerpt}</p>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

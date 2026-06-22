import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlogSEO, { SITE_URL } from "@/components/blog/BlogSEO";
import { listPublishedArticles, listPublications } from "@/lib/blog/queries";
import { pickTranslation, type BlogArticleWithRelations, type BlogLang, type BlogPublication, type PublicationSlug } from "@/lib/blog/types";
import { detectInitialLang, persistLang, BLOG_LANGS, langLabel, withLangPrefix, pubUrlSegment } from "@/lib/blog/locale";

const I18N = {
  pt: {
    eyebrow: "A SALBCARE ESCREVE SOBRE DUAS COISAS",
    headline: "Duas vozes. Uma missão.",
    sub: "Guias práticos para profissionais de saúde brasileiros e ensaios editoriais sobre o futuro do turismo em saúde.",
    proEyebrow: "PARA PROFISSIONAIS DE SAÚDE",
    journalEyebrow: "PARA O LEITOR CURIOSO",
    readPro: "Ler o blog →",
    readJournal: "Ler o Journal →",
    latest: "Mais recentes",
  },
  en: {
    eyebrow: "SALBCARE WRITES ABOUT TWO THINGS",
    headline: "Two voices. One mission.",
    sub: "Practical guides for Brazilian health professionals, and editorial essays on the future of healthcare tourism.",
    proEyebrow: "FOR HEALTH PROFESSIONALS",
    journalEyebrow: "FOR THE CURIOUS READER",
    readPro: "Read the blog →",
    readJournal: "Read the Journal →",
    latest: "Latest",
  },
  es: {
    eyebrow: "SALBCARE ESCRIBE SOBRE DOS COSAS",
    headline: "Dos voces. Una misión.",
    sub: "Guías prácticas para profesionales de salud brasileños y ensayos editoriales sobre el futuro del turismo en salud.",
    proEyebrow: "PARA PROFESIONALES DE SALUD",
    journalEyebrow: "PARA EL LECTOR CURIOSO",
    readPro: "Leer el blog →",
    readJournal: "Leer el Journal →",
    latest: "Más recientes",
  },
} as const;

export default function BlogHub() {
  const [lang, setLang] = useState<BlogLang>(detectInitialLang());
  const [pubs, setPubs] = useState<BlogPublication[]>([]);
  const [proPosts, setProPosts] = useState<BlogArticleWithRelations[]>([]);
  const [journalPosts, setJournalPosts] = useState<BlogArticleWithRelations[]>([]);

  useEffect(() => {
    (async () => {
      const [p, pro, journal] = await Promise.all([
        listPublications(),
        listPublishedArticles({ publicationSlug: "pro", limit: 3 }),
        listPublishedArticles({ publicationSlug: "journal", limit: 3 }),
      ]);
      setPubs(p);
      setProPosts(pro);
      setJournalPosts(journal);
    })();
  }, []);

  const t = I18N[lang];
  const pro = pubs.find((p) => p.slug === "pro");
  const journal = pubs.find((p) => p.slug === "journal");

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--brand-dark))", color: "hsl(var(--kite-cream))" }}>
      <BlogSEO
        noindex={true}
        title="SalbCare — Blog & Journal"
        description={t.sub}
        canonicalPath={withLangPrefix("/journal", lang)}
        hreflangPath="/journal"
        lang={lang}
        ogType="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "SalbCare Blog Hub",
          url: `${SITE_URL}/journal`,
          inLanguage: lang,
        }}
      />

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20 text-center">
        <p className="text-[10px] tracking-[0.25em] uppercase mb-6 opacity-70">{t.eyebrow}</p>
        <h1 className="font-journal text-4xl md:text-6xl leading-tight mb-6" style={{ letterSpacing: "-0.01em" }}>
          {t.headline}
        </h1>
        <p className="text-base md:text-lg opacity-80 max-w-2xl mx-auto">{t.sub}</p>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs">
          {BLOG_LANGS.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); persistLang(l); }}
              className={`px-3 py-1 rounded-full border transition-colors ${
                lang === l ? "border-white text-white" : "border-white/15 text-white/60 hover:text-white"
              }`}
            >
              {langLabel(l)}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-2 gap-8">
        <PubCard
          slug="pro"
          eyebrow={t.proEyebrow}
          publication={pro}
          posts={proPosts}
          lang={lang}
          accentVar="--blog-pro"
          cta={t.readPro}
          titleClass="font-pro font-bold"
          latest={t.latest}
        />
        <PubCard
          slug="journal"
          eyebrow={t.journalEyebrow}
          publication={journal}
          posts={journalPosts}
          lang={lang}
          accentVar="--blog-journal"
          cta={t.readJournal}
          titleClass="font-journal italic"
          latest={t.latest}
        />
      </section>
    </div>
  );
}

function PubCard({
  slug, eyebrow, publication, posts, lang, accentVar, cta, titleClass, latest,
}: {
  slug: PublicationSlug;
  eyebrow: string;
  publication: BlogPublication | undefined;
  posts: BlogArticleWithRelations[];
  lang: BlogLang;
  accentVar: string;
  cta: string;
  titleClass: string;
  latest: string;
}) {
  const description = publication
    ? (lang === "pt" ? publication.description_pt : lang === "es" ? publication.description_es : publication.description_en) || publication.description_en
    : "";
  const name = publication
    ? (lang === "pt" ? publication.name_pt : lang === "es" ? publication.name_es : publication.name_en) || publication.name_en
    : "";
  const href = withLangPrefix(`/journal/${pubUrlSegment(slug)}`, lang);

  return (
    <Link to={href} className="group block rounded-2xl p-8 md:p-10 transition-all hover:translate-y-[-2px]"
      style={{ background: "hsl(var(--brand-darker))", border: `1px solid hsl(var(${accentVar}) / 0.25)` }}
    >
      <p className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: `hsl(var(${accentVar}))` }}>
        {eyebrow}
      </p>
      <h2 className={`text-3xl md:text-4xl mb-4 ${titleClass}`}>{name}</h2>
      <p className="opacity-75 text-sm md:text-base leading-relaxed mb-6">{description}</p>

      {posts.length > 0 && (
        <div className="border-t border-white/10 pt-5 mb-6">
          <p className="text-[10px] uppercase tracking-widest opacity-50 mb-3">{latest}</p>
          <ul className="space-y-2">
            {posts.map((p) => {
              const t = pickTranslation(p, lang);
              return (
                <li key={p.id} className="text-sm opacity-90 truncate">· {t?.title ?? p.slug}</li>
              );
            })}
          </ul>
        </div>
      )}

      <span className="inline-block text-sm font-medium group-hover:translate-x-1 transition-transform"
        style={{ color: `hsl(var(${accentVar}))` }}>
        {cta}
      </span>
    </Link>
  );
}

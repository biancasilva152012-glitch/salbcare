import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublishedArticles } from "@/lib/blog/queries";
import { pickTranslation, type BlogArticleWithRelations } from "@/lib/blog/types";

const COLORS = {
  cream: "#FAF8F5",
  gold: "#C9A961",
  teal: "#0F2A33",
  muted: "#4A453B",
};

/**
 * Featured Journal section for the landing Hub.
 * Renders 3 most recent published articles from the international Journal
 * (publication slug "journal" → URL segment /journal/main).
 * Hides itself entirely when no articles are available.
 */
export default function JournalSection() {
  const [posts, setPosts] = useState<BlogArticleWithRelations[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listPublishedArticles({ publicationSlug: "journal", limit: 3 });
        if (alive) setPosts(list);
      } catch {
        if (alive) setPosts([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Loading or empty → render nothing (per spec edge cases)
  if (!posts || posts.length === 0) return null;

  return (
    <section
      aria-labelledby="journal-section-heading"
      style={{ background: COLORS.cream }}
      className="py-16 md:py-24"
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <p
            className="text-[10px] md:text-[11px] font-semibold uppercase mb-5"
            style={{ color: COLORS.gold, letterSpacing: "0.2em" }}
          >
            The SalbCare Journal
          </p>
          <h2
            id="journal-section-heading"
            className="font-heading italic text-3xl md:text-5xl mb-5"
            style={{ color: COLORS.teal, letterSpacing: "-0.01em", lineHeight: 1.1 }}
          >
            Field notes from the coast.
          </h2>
          <p
            className="font-heading text-base md:text-lg mx-auto max-w-xl"
            style={{ color: COLORS.muted }}
          >
            Essays on healthcare, geography, and the people who chose to recover
            somewhere beautiful.
          </p>
        </div>

        <div
          className={`grid gap-6 md:gap-8 ${
            posts.length === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : posts.length === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
              : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          {posts.map((p) => {
            const t = pickTranslation(p, "en") ?? pickTranslation(p, "pt") ?? pickTranslation(p, "es");
            if (!t) return null;
            const date = p.published_at || p.created_at;
            return (
              <Link
                key={p.id}
                to={`/journal/main/${p.slug}`}
                className="group block bg-white rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1"
                style={{ boxShadow: "0 1px 3px rgba(13,42,51,0.05), 0 4px 14px rgba(13,42,51,0.06)" }}
              >
                {p.featured_image_url ? (
                  <div className="aspect-[16/9] overflow-hidden bg-neutral-100">
                    <img
                      src={p.featured_image_url}
                      alt={p.featured_image_alt_en || t.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9]" style={{ background: COLORS.teal, opacity: 0.08 }} />
                )}
                <div className="p-6">
                  {p.category && (
                    <p
                      className="text-[10px] uppercase mb-3 font-semibold"
                      style={{ color: COLORS.gold, letterSpacing: "0.15em" }}
                    >
                      {p.category.name_en || p.category.slug}
                    </p>
                  )}
                  <h3
                    className="font-heading text-[20px] leading-snug mb-3 line-clamp-2"
                    style={{ color: COLORS.teal }}
                  >
                    {t.title}
                  </h3>
                  {t.excerpt && (
                    <p
                      className="text-sm leading-relaxed mb-4 line-clamp-3"
                      style={{ color: COLORS.muted }}
                    >
                      {t.excerpt}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: COLORS.muted, opacity: 0.8 }}>
                    {p.author?.name ?? "SalbCare"}
                    {date && (
                      <>
                        {" · "}
                        <time dateTime={date}>
                          {new Date(date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                      </>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/journal/main"
            className="inline-block text-sm font-semibold uppercase hover:underline"
            style={{ color: COLORS.gold, letterSpacing: "0.18em" }}
          >
            Read all essays →
          </Link>
        </div>
      </div>
    </section>
  );
}

// Public sitemap for the SalbCare Journal (blog).
// Lists every published article in EN/PT/ES with hreflang alternates.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://salbcare.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: articles } = await supabase
    .from("blog_articles")
    .select("slug, updated_at, published_at, status")
    .eq("status", "published");

  const { data: categories } = await supabase
    .from("blog_categories")
    .select("slug")
    .eq("is_active", true);

  const urls: string[] = [];

  const langs: Array<"en" | "pt" | "es"> = ["en", "pt", "es"];

  // Blog home
  for (const lang of langs) {
    const base = lang === "en" ? "/blog" : `/${lang}/blog`;
    urls.push(makeUrl(`${SITE}${base}`, new Date().toISOString(), 0.9, "/blog"));
  }

  // Categories
  for (const cat of categories ?? []) {
    for (const lang of langs) {
      const base = lang === "en" ? `/blog?cat=${cat.slug}` : `/${lang}/blog?cat=${cat.slug}`;
      urls.push(makeUrl(`${SITE}${base}`, new Date().toISOString(), 0.6, `/blog?cat=${cat.slug}`));
    }
  }

  // Articles
  for (const a of articles ?? []) {
    for (const lang of langs) {
      const base = lang === "en" ? `/blog/${a.slug}` : `/${lang}/blog/${a.slug}`;
      const lastmod = (a.updated_at || a.published_at || new Date().toISOString()).split("T")[0];
      urls.push(makeUrl(`${SITE}${base}`, lastmod, 0.8, `/blog/${a.slug}`));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function makeUrl(loc: string, lastmod: string, priority: number, hreflangPath: string): string {
  const alts = ["en", "pt", "es"]
    .map((l) => {
      const href = l === "en" ? `${SITE}${hreflangPath}` : `${SITE}/${l}${hreflangPath}`;
      return `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`;
    })
    .join("\n");
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
${alts}
  </url>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

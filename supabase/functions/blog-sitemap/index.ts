// Public sitemap for SalbCare blog (dual publications: Pro + Journal).
// Lists every published article under /blog/{pub}/{slug} in EN/PT/ES with hreflang alternates.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://salbcare.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

type Lang = "en" | "pt" | "es";
const LANGS: Lang[] = ["en", "pt", "es"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: pubs }, { data: articles }] = await Promise.all([
    supabase.from("blog_publications").select("id, slug"),
    supabase
      .from("blog_articles")
      .select("slug, updated_at, published_at, publication_id, status")
      .eq("status", "published"),
  ]);

  const pubBySlug = new Map((pubs ?? []).map((p: any) => [p.slug, p.id]));
  const slugByPubId = new Map((pubs ?? []).map((p: any) => [p.id, p.slug]));

  const urls: string[] = [];
  const now = new Date().toISOString();

  // Hub
  for (const lang of LANGS) {
    urls.push(makeUrl(absolute("/blog", lang), now, 0.9, "/blog"));
  }

  // Publication homes
  for (const pubSlug of pubBySlug.keys()) {
    const base = `/blog/${pubSlug}`;
    for (const lang of LANGS) {
      urls.push(makeUrl(absolute(base, lang), now, 0.85, base));
    }
  }

  // Articles
  for (const a of articles ?? []) {
    const pubSlug = slugByPubId.get(a.publication_id);
    if (!pubSlug) continue;
    const path = `/blog/${pubSlug}/${a.slug}`;
    const lastmod = (a.updated_at || a.published_at || now).split("T")[0];
    for (const lang of LANGS) {
      urls.push(makeUrl(absolute(path, lang), lastmod, 0.8, path));
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

function absolute(path: string, lang: Lang): string {
  return lang === "en" ? `${SITE}${path}` : `${SITE}/${lang}${path}`;
}

function makeUrl(loc: string, lastmod: string, priority: number, hreflangPath: string): string {
  const alts = LANGS
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absolute(hreflangPath, l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${hreflangPath}"/>`)
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

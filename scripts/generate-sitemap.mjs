#!/usr/bin/env node
// Generates public/sitemap.xml from the SEO route manifest.
// Runs on predev and prebuild; safe to run offline (no network calls).
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, SITE } from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public", "sitemap.xml");

const now = new Date().toISOString().slice(0, 10);

const urls = ROUTES.map((r) =>
  [
    "  <url>",
    `    <loc>${SITE}${r.path === "/" ? "/" : r.path}</loc>`,
    `    <lastmod>${now}</lastmod>`,
    r.changefreq ? `    <changefreq>${r.changefreq}</changefreq>` : null,
    r.priority ? `    <priority>${r.priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n"),
).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(OUT, xml);
console.log(`sitemap.xml written (${ROUTES.length} entries)`);

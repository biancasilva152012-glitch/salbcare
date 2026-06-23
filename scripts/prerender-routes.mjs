#!/usr/bin/env node
// Post-build prerender: rewrites per-route HTML so non-JS crawlers
// (WhatsApp, Slack, LinkedIn, X) see the right title/description/canonical/og:*
// in the raw HTML for / and /kite.
//
// We don't render the React tree — the SPA shell already hydrates fine.
// We just emit dist/<route>/index.html with the head replaced from the manifest.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, SITE } from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const SHELL = resolve(DIST, "index.html");

if (!existsSync(SHELL)) {
  console.error(`\u2717 prerender: ${SHELL} not found (run vite build first).`);
  process.exit(1);
}

const shell = readFileSync(SHELL, "utf8");

function escape(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function rewriteHead(html, route) {
  let out = html;

  // <title>...</title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(route.title)}</title>`);

  // meta name="description"
  out = out.replace(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escape(route.description)}">`,
  );

  // canonical
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(out)) {
    out = out.replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escape(route.canonical)}">`,
    );
  } else {
    out = out.replace(/<\/head>/i, `  <link rel="canonical" href="${escape(route.canonical)}">\n</head>`);
  }

  // og:title / og:description / og:url
  out = out.replace(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escape(route.title)}">`,
  );
  out = out.replace(
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escape(route.description)}">`,
  );
  out = out.replace(
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${escape(route.ogUrl)}">`,
  );

  // twitter:title / twitter:description
  out = out.replace(
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escape(route.title)}">`,
  );
  out = out.replace(
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escape(route.description)}">`,
  );

  return out;
}

let written = 0;
for (const route of ROUTES) {
  const html = rewriteHead(shell, route);
  let target;
  if (route.path === "/") {
    target = SHELL;
  } else {
    const dir = resolve(DIST, route.path.replace(/^\//, ""));
    mkdirSync(dir, { recursive: true });
    target = resolve(dir, "index.html");
  }
  writeFileSync(target, html);
  written++;
  console.log(`  \u2192 ${route.path} -> ${target.replace(DIST + "/", "dist/")}`);
}
console.log(`\u2713 prerender done (${written} routes, base ${SITE}).`);

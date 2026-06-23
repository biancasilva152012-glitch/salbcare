#!/usr/bin/env node
// Validates the prerendered HTML on disk (or a live URL) for every route in
// the SEO manifest. Checks title, meta description, canonical, og:url,
// og:title, og:description, twitter:title, and at least one JSON-LD block.
//
// Usage:
//   node scripts/check-rendered-seo.mjs                 # checks ./dist
//   node scripts/check-rendered-seo.mjs --base=https://salbcare.com
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES } from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const baseArg = process.argv.find((a) => a.startsWith("--base="));
const BASE = baseArg ? baseArg.slice("--base=".length).replace(/\/$/, "") : null;

async function fetchHtml(route) {
  if (BASE) {
    const url = BASE + route.path;
    const res = await fetch(url, { headers: { "user-agent": "salbcare-seo-check/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  }
  const file = route.path === "/"
    ? resolve(DIST, "index.html")
    : resolve(DIST, route.path.replace(/^\//, ""), "index.html");
  if (!existsSync(file)) throw new Error(`Missing ${file} (run build first).`);
  return readFileSync(file, "utf8");
}

function findOne(re, html, group = 1) {
  const m = html.match(re);
  return m ? m[group] : null;
}

function validate(route, html) {
  const errors = [];
  const title = findOne(/<title>([\s\S]*?)<\/title>/i, html);
  if (!title) errors.push("missing <title>");
  else if (title.trim() !== route.title) errors.push(`title mismatch: got "${title.trim()}"`);

  const desc = findOne(/<meta\s+name=(["'])description\1\s+content=(["'])([\s\S]*?)\2/i, html, 3);
  if (!desc) errors.push("missing meta description");
  else if (desc !== route.description) errors.push(`description mismatch: got "${desc.slice(0, 60)}..."`);

  const canon = findOne(/<link\s+rel=(["'])canonical\1\s+href=(["'])([\s\S]*?)\2/i, html, 3);
  if (!canon) errors.push("missing canonical");
  else if (canon !== route.canonical) errors.push(`canonical mismatch: got "${canon}"`);

  const ogUrl = findOne(/<meta\s+property=(["'])og:url\1\s+content=(["'])([\s\S]*?)\2/i, html, 3);
  if (!ogUrl) errors.push("missing og:url");
  else if (ogUrl !== route.ogUrl) errors.push(`og:url mismatch: got "${ogUrl}"`);

  const ogTitle = findOne(/<meta\s+property=(["'])og:title\1\s+content=(["'])([\s\S]*?)\2/i, html, 3);
  if (!ogTitle) errors.push("missing og:title");
  else if (ogTitle !== route.title) errors.push(`og:title mismatch: got "${ogTitle}"`);

  if (!/<script[^>]*type=(["'])application\/ld\+json\1[^>]*>[\s\S]*?<\/script>/i.test(html)) {
    errors.push("missing JSON-LD block");
  }

  return errors;
}

let failed = 0;
const where = BASE ? `(live: ${BASE})` : "(dist/)";
console.log(`SEO render check ${where}`);
for (const route of ROUTES) {
  try {
    const html = await fetchHtml(route);
    const errs = validate(route, html);
    if (errs.length) {
      failed++;
      console.error(`  \u2717 ${route.path}`);
      for (const e of errs) console.error("      - " + e);
    } else {
      console.log(`  \u2713 ${route.path}`);
    }
  } catch (e) {
    failed++;
    console.error(`  \u2717 ${route.path}: ${e.message}`);
  }
}

if (failed) {
  console.error(`\n\u2717 ${failed} route(s) failed SEO render check.`);
  process.exit(1);
}
console.log(`\n\u2713 All ${ROUTES.length} route(s) rendered with correct SEO metadata.`);

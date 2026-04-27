#!/usr/bin/env node
/**
 * Verificação leve de SEO + integridade do Index.tsx (landing principal).
 *
 * Roda no build local (não substitui Lighthouse). Garante que:
 *  - existe um único <h1>
 *  - title e meta description estão presentes e dentro dos limites
 *  - JSON-LD Organization, Product (SalbScore) e FAQPage estão válidos
 *  - imagens críticas têm alt text
 *  - a animação do círculo SalbScore não usa efeitos custosos (filter blur em loop, etc.)
 *
 * Uso: `node scripts/check-landing-seo.mjs`
 * Falha (exit 1) se encontrar erros bloqueantes; warnings não falham o build.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TARGET = resolve(ROOT, "src/pages/Index.tsx");

const errors = [];
const warnings = [];
const ok = [];

const src = readFileSync(TARGET, "utf8");

// 1. Title e description via SEOHead
const titleMatch = src.match(/title=\{?["'`]([^"'`]+)["'`]/);
if (!titleMatch) errors.push("SEOHead title ausente em Index.tsx.");
else if (titleMatch[1].length > 65) warnings.push(`Title >65 chars (${titleMatch[1].length}).`);
else ok.push(`Title (${titleMatch[1].length} chars).`);

const descMatch = src.match(/description=\{?["'`]([^"'`]+)["'`]/);
if (!descMatch) errors.push("SEOHead description ausente em Index.tsx.");
else if (descMatch[1].length > 165) warnings.push(`Description >165 chars (${descMatch[1].length}).`);
else ok.push(`Description (${descMatch[1].length} chars).`);

// 2. Único <h1>
const h1Count = (src.match(/<h1[\s>]/g) ?? []).length;
if (h1Count === 0) errors.push("Nenhum <h1> encontrado em Index.tsx.");
else if (h1Count > 1) errors.push(`Múltiplos <h1> (${h1Count}). Mantenha apenas um na landing.`);
else ok.push("H1 único.");

// 3. JSON-LD presente — Organization, Product/SalbScore, FAQPage
const jsonLdBlocks = [...src.matchAll(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const inlineJsonLd = [...src.matchAll(/(?:jsonLd|schema)\s*=\s*(\{[\s\S]*?\n\s*\})/g)].map((m) => m[1]);
const allJson = [...jsonLdBlocks, ...inlineJsonLd];
const jsonLdSrc = src + allJson.join("\n");

const requiredTypes = ["Organization", "FAQPage"];
for (const t of requiredTypes) {
  if (jsonLdSrc.includes(`"@type": "${t}"`) || jsonLdSrc.includes(`'@type': '${t}'`) || jsonLdSrc.includes(`"@type":"${t}"`)) {
    ok.push(`JSON-LD ${t} presente.`);
  } else {
    warnings.push(`JSON-LD ${t} não encontrado (recomendado para SEO).`);
  }
}
if (/SalbScore/i.test(jsonLdSrc) && /"@type":\s*"Product"/.test(jsonLdSrc)) {
  ok.push("JSON-LD Product (SalbScore) presente.");
} else {
  warnings.push("JSON-LD Product (SalbScore) não encontrado.");
}

// Validar parseabilidade dos blocos JSON-LD inline
for (const block of jsonLdBlocks) {
  try { JSON.parse(block.trim()); } catch (e) {
    errors.push(`JSON-LD inline inválido: ${e.message.slice(0, 80)}`);
  }
}

// 4. Imagens com alt text
const imgs = [...src.matchAll(/<img\b([^>]*)\/?>/g)].map((m) => m[1]);
const imgsSemAlt = imgs.filter((attrs) => !/\balt\s*=/.test(attrs));
if (imgsSemAlt.length > 0) errors.push(`${imgsSemAlt.length} <img> sem alt em Index.tsx.`);
else if (imgs.length > 0) ok.push(`${imgs.length} <img> com alt.`);

// 5. Performance da animação SalbScore — bloqueia padrões custosos
const blurInLoop = /animate=\{[^}]*filter:\s*["'`]blur/.test(src);
if (blurInLoop) warnings.push("Animação com 'filter: blur' detectada — custo alto de pintura.");
const heavyAnim = /animate=\{[^}]*boxShadow/.test(src);
if (heavyAnim) warnings.push("Animação contínua de boxShadow detectada — prefira transform/opacity.");

// 6. Verificações de Web Vitals friendly
if (!/loading=["']lazy["']/.test(src) && imgs.length > 0) {
  warnings.push("Nenhuma imagem com loading=\"lazy\" — considere para LCP.");
} else if (imgs.length > 0) {
  ok.push("Lazy loading detectado em imagens.");
}

// Saída
const log = (label, items, color) => {
  if (!items.length) return;
  const colors = { red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m", reset: "\x1b[0m" };
  console.log(`\n${colors[color]}${label} (${items.length})${colors.reset}`);
  items.forEach((i) => console.log(`  ${i}`));
};

console.log(`\nLanding SEO check — ${TARGET.replace(ROOT + "/", "")}`);
log("✓ OK", ok, "green");
log("⚠ Warnings", warnings, "yellow");
log("✗ Errors", errors, "red");

if (errors.length) {
  console.log(`\n✗ ${errors.length} erro(s) bloqueante(s).`);
  process.exit(1);
}
console.log(`\n✓ Sem erros bloqueantes (${warnings.length} warnings).`);

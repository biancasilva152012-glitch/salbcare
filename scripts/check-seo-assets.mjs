#!/usr/bin/env node
// Blocks the build when SEO/social assets are missing or wrong-size.
// Required:
//   public/logo.png       >= 112x112
//   public/og-image.png   exactly 1200x630
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function pngSize(file) {
  const buf = readFileSync(file);
  // PNG signature 8 bytes + IHDR chunk: length(4) + 'IHDR'(4) + width(4) + height(4)
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${file} is not a valid PNG`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

const checks = [
  { file: "public/logo.png", min: { w: 112, h: 112 } },
  { file: "public/og-image.png", exact: { w: 1200, h: 630 } },
];

const errors = [];
for (const c of checks) {
  const abs = resolve(ROOT, c.file);
  if (!existsSync(abs)) {
    errors.push(`Missing ${c.file}`);
    continue;
  }
  try {
    const { width, height } = pngSize(abs);
    if (c.exact && (width !== c.exact.w || height !== c.exact.h)) {
      errors.push(`${c.file} is ${width}x${height}, expected exactly ${c.exact.w}x${c.exact.h}`);
    }
    if (c.min && (width < c.min.w || height < c.min.h)) {
      errors.push(`${c.file} is ${width}x${height}, expected at least ${c.min.w}x${c.min.h}`);
    }
  } catch (e) {
    errors.push(`${c.file}: ${e.message}`);
  }
}

if (errors.length) {
  console.error("\u2717 SEO asset check failed:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("\u2713 SEO assets OK (logo.png + og-image.png 1200x630).");

#!/usr/bin/env node
/**
 * Pre-deploy guard for Supabase Edge Functions.
 *
 * 1. Fails if any function imports `npm:@supabase/supabase-js` (must use esm.sh
 *    to avoid `Could not find a matching package` errors at deploy time).
 * 2. Reports version mismatches across functions for shared deps
 *    (@supabase/supabase-js, stripe).
 *
 * Exit codes:
 *   0 → all clean
 *   1 → forbidden import found OR version mismatch detected
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FUNCTIONS_DIR = "supabase/functions";
const FORBIDDEN = /from\s+["']npm:@supabase\/supabase-js(@[^"']+)?["']/g;

// Track: pkg → Map<version, string[] files>
const versions = {
  "@supabase/supabase-js": new Map(),
  stripe: new Map(),
};

const VERSION_PATTERNS = [
  // npm:pkg@x.y.z
  { pkg: "@supabase/supabase-js", re: /npm:@supabase\/supabase-js@([^"'\/\s]+)/g },
  { pkg: "@supabase/supabase-js", re: /esm\.sh\/@supabase\/supabase-js@([^"'\/\s]+)/g },
  { pkg: "stripe", re: /npm:stripe@([^"'\/\s]+)/g },
  { pkg: "stripe", re: /esm\.sh\/stripe@([^"'\/\s]+)/g },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|js|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

let forbiddenFindings = [];

const files = walk(FUNCTIONS_DIR);
for (const file of files) {
  const src = readFileSync(file, "utf8");

  // Forbidden import check
  const matches = src.match(FORBIDDEN);
  if (matches) {
    forbiddenFindings.push({ file, matches });
  }

  // Version collection
  for (const { pkg, re } of VERSION_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const v = m[1];
      if (!versions[pkg].has(v)) versions[pkg].set(v, []);
      versions[pkg].get(v).push(file);
    }
  }
}

let hasError = false;

console.log("\n🔍 Edge Function dependency check\n");

if (forbiddenFindings.length > 0) {
  hasError = true;
  console.error("❌ Forbidden `npm:@supabase/supabase-js` imports found:");
  for (const f of forbiddenFindings) {
    console.error(`   ${f.file}`);
    for (const m of f.matches) console.error(`     → ${m}`);
  }
  console.error(
    "\n   Fix: use `https://esm.sh/@supabase/supabase-js@<version>` instead.\n"
  );
} else {
  console.log("✅ No forbidden `npm:@supabase/supabase-js` imports.");
}

console.log("\n📦 Version usage across edge functions:");
for (const [pkg, map] of Object.entries(versions)) {
  if (map.size === 0) {
    console.log(`   ${pkg}: (not used)`);
    continue;
  }
  console.log(`   ${pkg}:`);
  for (const [v, fs] of map.entries()) {
    console.log(`     • ${v}  (${fs.length} file${fs.length === 1 ? "" : "s"})`);
    for (const f of fs) console.log(`         - ${f}`);
  }
  if (map.size > 1) {
    hasError = true;
    console.error(
      `   ⚠️  Version mismatch detected for ${pkg} — align all functions to the same version.`
    );
  }
}

console.log("");
process.exit(hasError ? 1 : 0);

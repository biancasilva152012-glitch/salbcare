#!/usr/bin/env node
/**
 * Falha o build quando existem múltiplas cópias de react ou react-dom na árvore
 * de dependências. Duas instâncias do React causam o crash de tela branca
 * "TypeError: null is not an object (evaluating 'dispatcher.useRef')".
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = ["react", "react-dom"];
const found = new Map(TARGETS.map((name) => [name, []]));

function readVersion(pkgDir) {
  try {
    const raw = readFileSync(path.join(pkgDir, "package.json"), "utf8");
    return JSON.parse(raw).version ?? "unknown";
  } catch {
    return null;
  }
}

function scan(nodeModulesDir, depth = 0, inScope = false) {
  if (depth > 6 || !existsSync(nodeModulesDir)) return;

  let entries;
  try {
    entries = readdirSync(nodeModulesDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    if (entry.name === ".bin" || entry.name === ".cache" || entry.name === ".vite") continue;

    const fullPath = path.join(nodeModulesDir, entry.name);

    if (entry.name.startsWith("@")) {
      scan(fullPath, depth, true); // pasta de escopo (@org): não conta como nível
      continue;
    }

    // Só interessa "react"/"react-dom" no topo do node_modules, nunca
    // "@sentry/react" ou "@testing-library/react".
    if (!inScope && TARGETS.includes(entry.name)) {
      const version = readVersion(fullPath);
      if (version) {
        found.get(entry.name).push({ version, location: path.relative(ROOT, fullPath) });
      }
    }

    const nested = path.join(fullPath, "node_modules");
    try {
      if (statSync(nested).isDirectory()) scan(nested, depth + 1);
    } catch {
      /* sem node_modules aninhado */
    }
  }
}

scan(path.join(ROOT, "node_modules"));

const problems = [];
for (const name of TARGETS) {
  const copies = found.get(name);
  const versions = [...new Set(copies.map((c) => c.version))];
  if (copies.length > 1 || versions.length > 1) {
    problems.push({ name, copies, versions });
  }
}

if (problems.length > 0) {
  console.error("\n❌ Múltiplas cópias do React detectadas.\n");
  for (const problem of problems) {
    console.error(`  ${problem.name}: ${problem.copies.length} cópia(s), versões: ${problem.versions.join(", ")}`);
    for (const copy of problem.copies) {
      console.error(`    - ${copy.version}  ${copy.location}`);
    }
  }
  console.error(
    "\nIsso quebra os hooks em runtime (tela branca: \"dispatcher.useRef\" é null).\n" +
      "Como resolver:\n" +
      "  1. Garanta uma única versão de react e react-dom no package.json.\n" +
      "  2. Remova versões aninhadas (bun install / npm dedupe).\n" +
      "  3. Mantenha resolve.dedupe: [\"react\", \"react-dom\"] no vite.config.ts.\n" +
      "  4. Limpe o cache: rm -rf node_modules/.vite\n"
  );
  process.exit(1);
}

const versions = TARGETS.map((name) => `${name}@${found.get(name)[0]?.version ?? "ausente"}`);
console.log(`✅ React único: ${versions.join(", ")}`);

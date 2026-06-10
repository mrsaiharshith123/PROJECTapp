#!/usr/bin/env node
/**
 * Find production modules only referenced from __tests__ (dead ship candidates).
 *
 * Usage:
 *   node scripts/audit-orphan-modules.mjs
 *   node scripts/audit-orphan-modules.mjs --json
 *   node scripts/audit-orphan-modules.mjs --list
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const JSON_OUT = process.argv.includes("--json");
const LIST = process.argv.includes("--list") || JSON_OUT;

const SCAN_DIRS = ["engines", "services", "hooks", "utils"].map((d) => path.join(SRC, d));

const SKIP_DIRS = new Set(["__tests__", "node_modules", "messages"]);

/** @param {string} dir @param {string[]} acc @param {{ codeOnly?: boolean }} [opts] */
function walkJs(dir, acc = [], opts = {}) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      if (opts.codeOnly && e.name === "i18n") continue;
      walkJs(p, acc, opts);
    } else if (/\.(js|jsx|mjs)$/.test(e.name) && !e.name.endsWith(".test.js")) {
      acc.push(p);
    }
  }
  return acc;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

/** @param {string} fromFile @param {string} spec */
function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.dirname(fromFile);
  let target = path.resolve(base, spec);
  const exts = ["", ".js", ".jsx", "/index.js"];
  for (const ext of exts) {
    const candidate = target + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return path.normalize(candidate);
  }
  return null;
}

/** @param {string} file */
function isTestFile(file) {
  return file.includes("__tests__") || /\.test\.(js|jsx|mjs)$/.test(file);
}

/** @param {string} targetNorm */
function findImporters(targetNorm) {
  const importers = [];
  const allSrc = walkJs(SRC, [], { codeOnly: true });
  const importRe = /from\s+["']([^"']+)["']/g;
  const requireRe = /require\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const file of allSrc) {
    const code = fs.readFileSync(file, "utf8");
    const specs = new Set();
    for (const m of code.matchAll(importRe)) specs.add(m[1]);
    for (const m of code.matchAll(requireRe)) specs.add(m[1]);
    for (const spec of specs) {
      if (!spec.startsWith(".")) continue;
      const resolved = resolveImport(file, spec);
      if (resolved && path.normalize(resolved) === targetNorm) {
        importers.push(file);
        break;
      }
    }
  }
  return importers;
}

function main() {
  const candidates = SCAN_DIRS.flatMap((d) => walkJs(d));
  /** @type {{ file: string, importers: string[] }[]} */
  const orphans = [];

  for (const file of candidates) {
    const importers = findImporters(path.normalize(file));
    if (importers.length === 0) continue;
    const prodImporters = importers.filter((f) => !isTestFile(f));
    if (prodImporters.length === 0) {
      orphans.push({
        file: rel(file),
        importers: importers.map(rel),
      });
    }
  }

  orphans.sort((a, b) => a.file.localeCompare(b.file));

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: orphans.length, items: orphans }));
    process.exit(orphans.length ? 1 : 0);
  }

  if (!LIST) {
    console.log(`Orphan modules: ${orphans.length} (only imported from tests)\n`);
  }

  if (!orphans.length) {
    if (LIST) console.log("Orphan modules: none");
    else console.log("OK — no test-only production modules.");
    process.exit(0);
  }

  console.log(`Orphan modules — ${orphans.length} (only imported from __tests__)\n`);
  orphans.forEach((o, i) => {
    console.log(`  ${i + 1}. ${o.file}`);
    console.log(`     tests: ${o.importers.join(", ")}`);
  });
  console.log("\nRemove the module and its tests, or wire it into the app.");
  process.exit(1);
}

main();

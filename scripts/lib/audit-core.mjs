/**
 * Shared utilities for CommitTrack audit / governance scripts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");
export const SRC = path.join(ROOT, "src");
export const UI = path.join(SRC, "ui");

export const IMPORT_RE = /(?:import|export)\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g;
export const DYNAMIC_IMPORT_RE = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

export function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

export function parseArgs(argv = process.argv.slice(2)) {
  return {
    json: argv.includes("--json"),
    list: argv.includes("--list"),
    quiet: argv.includes("--quiet"),
    verbose: argv.includes("--verbose"),
    quick: argv.includes("--quick"),
    strict: argv.includes("--strict"),
    category: argv.find((a) => a.startsWith("--only="))?.slice(7) || null,
  };
}

export function walk(dir, acc = [], ext = /\.(jsx?|mjs|css)$/) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", "dist", "dev-dist", "__tests__"].includes(e.name)) continue;
      walk(p, acc, ext);
    } else if (ext.test(e.name)) acc.push(p);
  }
  return acc;
}

export function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const suffix of ["", ".js", ".jsx", "/index.js", "/index.jsx"]) {
    const candidate = base + suffix;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export function importSpecsFromFile(file) {
  const code = fs.readFileSync(file, "utf8");
  const specs = [];
  for (const m of code.matchAll(IMPORT_RE)) specs.push(m[1]);
  for (const m of code.matchAll(DYNAMIC_IMPORT_RE)) specs.push(m[1]);
  return specs;
}

export function buildReachable(entryFiles) {
  const queue = entryFiles.filter((f) => fs.existsSync(f));
  const seen = new Set(queue);
  while (queue.length) {
    const file = queue.shift();
    for (const spec of importSpecsFromFile(file)) {
      if (!spec.startsWith(".")) continue;
      const resolved = resolveImport(file, spec);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        queue.push(resolved);
      }
    }
  }
  return seen;
}

/** @typedef {{ kind: string, message: string, file?: string, detail?: string, priority?: string }} Finding */

/**
 * @param {{ id: string, title: string, errors: Finding[], warnings: Finding[], advisories?: Finding[] }} report
 */
export function summarize(report) {
  return {
    id: report.id,
    title: report.title,
    errors: report.errors.length,
    warnings: report.warnings.length,
    advisories: (report.advisories || []).length,
    ok: report.errors.length === 0,
    items: [...report.errors, ...report.warnings, ...(report.advisories || [])],
    errorItems: report.errors,
    warningItems: report.warnings,
    advisoryItems: report.advisories || [],
  };
}

export function printReport(report, opts = {}) {
  const s = summarize(report);
  if (opts.json) {
    console.log(JSON.stringify(s));
    return s;
  }
  if (!opts.list && s.errors + s.warnings + s.advisories === 0) {
    console.log(`\n${report.title} — OK\n`);
    return s;
  }
  console.log(`\n${report.title} — ${s.errors} error(s), ${s.warnings} warning(s), ${s.advisories} advisory(s)\n`);
  const print = (items, tag) => {
    for (const f of items) {
      const loc = f.file ? `${f.file}: ` : "";
      console.log(`  [${tag}] ${loc}${f.message}${f.detail ? ` — ${f.detail}` : ""}`);
    }
  };
  print(report.errors, "error");
  print(report.warnings, "warn");
  print(report.advisories || [], "info");
  console.log("");
  return s;
}

export function exitCode(summary, strict = false) {
  if (summary.errors > 0) return 1;
  if (strict && summary.warnings > 0) return 1;
  return 0;
}

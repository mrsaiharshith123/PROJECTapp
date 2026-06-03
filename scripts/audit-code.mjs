#!/usr/bin/env node
/**
 * Code health audit: lint, unused/dead code, duplicates, stray files, bad patterns.
 *
 * Usage:
 *   Internal: called by scripts/audit-all.mjs (--json for machine report)
 */
import { spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const STRICT = process.argv.includes("--strict");
const JSON_OUT = process.argv.includes("--json");
const QUIET = JSON_OUT || process.argv.includes("--quiet");

const errors = [];
const warnings = [];
/** @type {Record<string, unknown>} */
let uiDepthSummary = { total: 0 };

function addError(category, message, detail = "") {
  errors.push({ category, message, detail });
}
function addWarning(category, message, detail = "") {
  warnings.push({ category, message, detail });
}

function walk(dir, acc = [], ext = /\.(jsx?|mjs)$/) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "dist" || e.name === "__tests__") continue;
      walk(p, acc, ext);
    } else if (ext.test(e.name)) acc.push(p);
  }
  return acc;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

// ── 1. ESLint ────────────────────────────────────────────────────────────────
function runEslint() {
  const r = spawnSync("npx", ["eslint", ".", "-f", "json"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  let results = [];
  try {
    const parsed = JSON.parse(r.stdout || "[]");
    results = Array.isArray(parsed) ? parsed : [];
  } catch {
    addWarning("eslint", "Could not parse ESLint JSON — run `npm run lint` manually");
    return;
  }

  let errCount = 0;
  let warnCount = 0;
  const messages = [];

  for (const file of results) {
    errCount += file.errorCount || 0;
    warnCount += file.warningCount || 0;
    for (const msg of file.messages || []) {
      const fp = rel(file.filePath);
      const loc = `${fp}:${msg.line}:${msg.column}`;
      const text = `${loc} — ${msg.message} (${msg.ruleId || "eslint"})`;
      messages.push({ severity: msg.severity, text });
    }
  }

  for (const m of messages.slice(0, 50)) {
    const entry = { category: "eslint", message: m.text, detail: "" };
    if (m.severity === 2) errors.push(entry);
    else warnings.push(entry);
  }
  if (messages.length > 50) {
    addWarning("eslint", `… and ${messages.length - 50} more lint issue(s) (run npm run lint)`);
  }

  return { errors: errCount, warnings: warnCount };
}

// ── 2. Knip (unused files / exports / deps) ──────────────────────────────────
function runKnip() {
  const r = spawnSync("npx", ["knip", "--reporter", "json", "--no-progress"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  const raw = (r.stdout || "").trim();
  if (!raw.startsWith("{")) {
    addWarning("knip", "Knip did not return JSON — is knip installed?", raw.slice(0, 120));
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    addWarning("knip", "Failed to parse knip JSON output");
    return;
  }

  const unusedFiles = data.files || [];
  for (const f of unusedFiles) {
    addError("unused-file", `Unused file (not reachable from entry points): ${f}`);
  }

  const exportIssues = [];
  const exportDupes = [];
  for (const issue of data.issues || []) {
    const file = issue.file?.replace(/\\/g, "/");
    for (const ex of issue.exports || []) {
      exportIssues.push({ file, name: ex.name, line: ex.line });
    }
    for (const group of issue.duplicates || []) {
      const names = group.map((g) => g.name);
      const isNamedPlusDefault =
        names.length === 2 && names.includes("default") && names.some((n) => n !== "default");
      if (isNamedPlusDefault) continue;
      exportDupes.push({ file, names: names.join(", ") });
    }
  }

  const filteredExports = exportIssues.filter((e) => {
    if (e.name === "default" && e.file.startsWith("src/ui/")) return false;
    return true;
  });

  const knipStats = {
    unusedFiles: unusedFiles.length,
    unusedExports: filteredExports.length,
    duplicateExports: exportDupes.length,
  };

  const exportCap = 20;
  for (const e of filteredExports.slice(0, exportCap)) {
    addWarning("unused-export", `${e.file}:${e.line} — export \`${e.name}\` is never imported`);
  }
  if (filteredExports.length > exportCap) {
    addWarning("unused-export", `… and ${filteredExports.length - exportCap} more unused export(s)`);
  }
  for (const d of exportDupes) {
    addWarning("duplicate-export", `${d.file} — duplicate/overlapping exports: ${d.names}`);
  }
  return knipStats;
}

// ── 3. Stray / legacy paths ──────────────────────────────────────────────────
function checkLegacyPaths() {
  const componentsDir = path.join(SRC, "components");
  if (fs.existsSync(componentsDir)) {
    const files = walk(componentsDir);
    if (files.length) {
      addError(
        "legacy-path",
        `src/components/ still has ${files.length} file(s) — UI belongs in src/ui/ only`,
        files.slice(0, 5).map(rel).join(", "),
      );
    }
  }

  const shimNames = ["Card.jsx", "Modal.jsx", "Navbar.jsx", "ToolWidget.jsx"];
  for (const name of shimNames) {
    const p = path.join(componentsDir, name);
    if (fs.existsSync(p)) {
      addError("legacy-shim", `Remove duplicate re-export shim: ${rel(p)}`);
    }
  }
}

// ── 4. Suspicious import / migration patterns ────────────────────────────────
const BAD_IMPORT_PATTERNS = [
  { re: /from\s+["']\.\.\/\.\.["']{2}/, label: "broken import (extra quote after ../..)" },
  { re: /from\s+["']\.\.\/\.\.["'][/]/, label: "broken import (../..\"/path)" },
  { re: /constants["'][/][a-zA-Z]/, label: "broken import (constants\"/path)" },
  { re: /from\s+["']\.\.\/components[/]/, label: "import from removed src/components/" },
  { re: /\bisEnhancedUi\b/, label: "removed dual UI flag isEnhancedUi" },
  { re: /\bfos-(?:btn|card|nav)/, label: "legacy fos-* class" },
];

function checkBadPatterns() {
  for (const file of walk(SRC)) {
    const code = fs.readFileSync(file, "utf8");
    const r = rel(file);
    for (const { re, label } of BAD_IMPORT_PATTERNS) {
      if (re.test(code)) {
        addError("bad-pattern", `${r}: ${label}`);
        break;
      }
    }
  }
}

// ── 5. Page shells must re-export UI only ────────────────────────────────────
function checkPageShells() {
  const pagesDir = path.join(SRC, "pages");
  if (!fs.existsSync(pagesDir)) return;
  for (const e of fs.readdirSync(pagesDir, { withFileTypes: true })) {
    if (!e.isFile() || !e.name.endsWith(".jsx")) continue;
    const p = path.join(pagesDir, e.name);
    const code = fs.readFileSync(p, "utf8");
    const lines = code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//"));
    const isReexport =
      /export\s+\{\s*default\s*\}\s+from\s+["']\.\.\/ui\//.test(code) && lines.length <= 3;
    const isRedirectShell =
      !code.includes("className=") &&
      /navigate\s*\(/.test(code) &&
      !code.includes("return (") &&
      lines.length <= 12;
    if (!isReexport && !isRedirectShell && (code.includes("className=") || /return\s*\(/.test(code))) {
      addError(
        "page-shell",
        `${rel(p)} should re-export UI from src/ui/features/pages/ or be a tiny redirect-only shell`,
      );
    }
  }
}

// ── 6. Duplicate basename (same filename, multiple locations) ──────────────────
function checkDuplicateBasenames() {
  const byBase = new Map();
  for (const file of walk(SRC)) {
    const base = path.basename(file);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(rel(file));
  }
  for (const [base, paths] of byBase) {
    if (paths.length < 2) continue;
    if (base === "index.js" || base.endsWith(".test.js")) continue;
    const hasUi = paths.some((p) => p.startsWith("src/ui/"));
    const hasNonUi = paths.some((p) => !p.startsWith("src/ui/") && !p.includes("__tests__"));
    if (hasUi && hasNonUi) {
      addError("duplicate-name", `Same filename in ui and elsewhere: ${base}`, paths.join(" | "));
    } else if (paths.length > 2) {
      addWarning("duplicate-name", `Filename used ${paths.length} times: ${base}`, paths.join(" | "));
    }
  }
}

// ── 7. Identical file content (true duplicates) ──────────────────────────────
function normalizeForHash(code) {
  return code.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function checkIdenticalFiles() {
  const byHash = new Map();
  for (const file of walk(SRC)) {
    const r = rel(file);
    if (r.includes("__tests__")) continue;
    const code = fs.readFileSync(file, "utf8");
    if (code.length < 400) continue;
    const hash = crypto.createHash("sha256").update(normalizeForHash(code)).digest("hex").slice(0, 16);
    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(r);
  }
  for (const [, paths] of byHash) {
    if (paths.length < 2) continue;
    addError("duplicate-content", `Identical or near-identical files (${paths.length})`, paths.join(" | "));
  }
}

// ── 8. Quick unresolved import scan (relative paths) ─────────────────────────
function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.dirname(fromFile);
  let target = path.resolve(base, spec);
  const exts = ["", ".js", ".jsx", "/index.js", "/index.jsx"];
  for (const ext of exts) {
    const candidate = target + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function runUiDepthAudit() {
  const r = spawnSync("node", ["scripts/audit-ui-depth.mjs", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
  });
  let data = { total: 0, items: [] };
  try {
    data = JSON.parse((r.stdout || "").trim() || "{}");
  } catch {
    addWarning("ui-depth", "Could not parse UI depth audit output");
    return;
  }
  uiDepthSummary = data;
  for (const f of data.items || []) {
    const msg = formatUiDepthFinding(f);
    addWarning("ui-depth", msg);
  }
  if (!data.total && !QUIET) console.log("  UI depth: all screens and controls wired");
}

function formatUiDepthFinding(f) {
  switch (f.kind) {
    case "barrel-export":
      return `Barrel export \`${f.name}\` never imported`;
    case "unmounted-page":
      return `Page \`${f.file}\` not routed`;
    case "unreachable-ui":
      return `UI module \`${f.file}\` not reachable from App`;
    case "tool-no-handler":
      return `Tool tile \`${f.id}\` has no modal handler in DashboardTools`;
    case "nav-no-route":
      return `Nav link \`${f.path}\` has no matching Route`;
    case "dead-screen-buttons": {
      const parts = Object.entries(f.counts || {})
        .map(([k, v]) => `${k}×${v}`)
        .join(", ");
      return `\`${f.file}\`: ${f.total} button(s) (${parts}) in unreachable file`;
    }
    case "export-never-rendered":
      return `\`${f.name}\` imported but never rendered (<${f.name}>)`;
    case "barrel-never-imported":
      return `\`${f.name}\` in barrel, never imported`;
    default:
      return JSON.stringify(f);
  }
}

function checkUnresolvedImports() {
  const importRe = /from\s+["']([^"']+)["']/g;
  for (const file of walk(SRC)) {
    const code = fs.readFileSync(file, "utf8");
    for (const m of code.matchAll(importRe)) {
      const spec = m[1];
      if (!spec.startsWith(".")) continue;
      if (!resolveImport(file, spec)) {
        addError("unresolved-import", `${rel(file)} — cannot resolve \`${spec}\``);
        break;
      }
    }
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────
if (!QUIET) console.log("Code audit\n");

if (!QUIET) console.log("── Lint (ESLint)");
const eslintStats = runEslint() || { errors: 0, warnings: 0 };

if (!QUIET) console.log("\n── Dead code (Knip)");
const knipStats = runKnip() || { unusedFiles: 0, unusedExports: 0, duplicateExports: 0 };

if (!QUIET) console.log("\n── Project hygiene");
checkLegacyPaths();
checkBadPatterns();
checkPageShells();
checkDuplicateBasenames();
checkIdenticalFiles();
checkUnresolvedImports();

if (!QUIET) console.log("\n── UI depth (screens, buttons, tools, barrel)");
runUiDepthAudit();

const strictWarnings = STRICT ? warnings : [];
const failCount = errors.length + strictWarnings.length;

const payload = {
  errors: errors.length,
  warnings: warnings.length,
  blocking: failCount,
  eslint: eslintStats,
  knip: knipStats,
  uiDepth: {
    total: uiDepthSummary.total ?? 0,
    barrelExports: uiDepthSummary.barrelExports ?? [],
    deadButtons: uiDepthSummary.deadButtons ?? [],
    orphanTools: uiDepthSummary.orphanTools ?? [],
  },
  errorItems: errors,
  warningItems: warnings,
};

if (JSON_OUT) {
  console.log(JSON.stringify(payload));
  process.exit(failCount === 0 ? 0 : 1);
}

console.log("\n════════════════════════════════════════");
console.log(
  `Summary: ${errors.length} error(s), ${warnings.length} warning(s)` +
    (STRICT ? " (strict: warnings fail too)" : ""),
);

if (errors.length) {
  console.log("\nErrors:");
  const byCat = new Map();
  for (const e of errors) {
    if (!byCat.has(e.category)) byCat.set(e.category, []);
    byCat.get(e.category).push(e);
  }
  for (const [cat, items] of [...byCat.entries()].sort()) {
    console.log(`\n  [${cat}]`);
    for (const i of items.slice(0, 25)) {
      console.log(`    • ${i.message}${i.detail ? ` — ${i.detail}` : ""}`);
    }
    if (items.length > 25) console.log(`    … and ${items.length - 25} more`);
  }
}

if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings.slice(0, 30)) {
    console.log(`    • [${w.category}] ${w.message}${w.detail ? ` — ${w.detail}` : ""}`);
  }
  if (warnings.length > 30) console.log(`    … and ${warnings.length - 30} more`);
}

if (failCount === 0) {
  console.log("\nOK — no blocking code issues.");
  process.exit(0);
}

console.log(`\nFAILED — ${failCount} blocking issue(s).`);
process.exit(1);

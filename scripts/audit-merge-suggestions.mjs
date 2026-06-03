#!/usr/bin/env node
/**
 * Advisory: when folding files into ONE existing module reduces clutter.
 * Never suggests creating new files or vague "consider merging this folder".
 *
 * npm run audit:merge
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const JSON_OUT = process.argv.includes("--json");
const LIST = process.argv.includes("--list");

const MAX_LEAF_LINES = 120;
const MAX_COMBINED_LINES = 320;
const MAX_REEXPORT_LINES = 5;

const SKIP_DIRS = new Set(["__tests__", "node_modules", "dist", "dev-dist"]);
const SKIP_FILES = new Set(["index.js", "main.jsx", "App.jsx"]);

/** @type {{ into: string, from: string[], reason: string, lines: number, priority: string }[]} */
const suggestions = [];

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(p, acc);
    } else if (/\.(jsx?|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function lineCount(file) {
  return fs.readFileSync(file, "utf8").split("\n").length;
}

function isReexportOnly(code) {
  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("/*") && l !== "*/");
  if (lines.length > 4) return false;
  return lines.every((l) => /^export\s+/.test(l) || /^import\s+/.test(l)) && /export\s+/.test(code);
}

function resolveLocal(dir, spec) {
  const base = path.resolve(dir, spec);
  for (const ext of ["", ".js", ".jsx"]) {
    const c = base + ext;
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function localImports(code, dir) {
  const specs = [];
  for (const m of code.matchAll(/from\s+["'](\.\/[^"']+)["']/g)) specs.push(m[1]);
  return specs.map((spec) => resolveLocal(dir, spec)).filter(Boolean);
}

function importSpecs(code) {
  const specs = [];
  for (const m of code.matchAll(/from\s+["']([^"']+)["']/g)) specs.push(m[1]);
  return specs;
}

/** @type {Map<string, Set<string>>} targetRel → importer rels */
const importersOf = new Map();

function resolveImport(fromAbs, spec) {
  const dir = path.dirname(fromAbs);
  if (spec.startsWith(".")) return resolveLocal(dir, spec);
  return null;
}

function buildImporterMap() {
  for (const file of allFiles) {
    const fromRel = rel(file);
    const code = fs.readFileSync(file, "utf8");
    for (const spec of importSpecs(code)) {
      const target = resolveImport(file, spec);
      if (!target) continue;
      const targetRel = rel(target);
      if (!importersOf.has(targetRel)) importersOf.set(targetRel, new Set());
      importersOf.get(targetRel).add(fromRel);
    }
  }
}

function soleImporter(targetRel) {
  const set = importersOf.get(targetRel);
  if (!set || set.size !== 1) return null;
  return [...set][0];
}

function isBarrelIndex(fileAbs) {
  if (path.basename(fileAbs) !== "index.js") return false;
  const code = fs.readFileSync(fileAbs, "utf8");
  const reExports = (code.match(/export\s+[\s\S]*?\s+from\s+["']/g) || []).length;
  return reExports >= 2;
}

function basename(p) {
  return path.basename(p);
}

/**
 * @param {string} intoRel
 * @param {string[]} fromRel
 * @param {string} reason
 * @param {number} lines
 * @param {"high"|"medium"|"low"} priority
 */
function add(intoRel, fromRel, reason, lines, priority = "medium") {
  if (!fromRel.length) return;
  fromRel = fromRel.filter((f) => f !== intoRel);
  if (!fromRel.length) return;
  suggestions.push({ into: intoRel, from: fromRel, reason, lines, priority });
}

const allFiles = walk(SRC);
buildImporterMap();

const linesByRel = new Map();
for (const file of allFiles) {
  linesByRel.set(rel(file), lineCount(file));
}

// ── 1. Fold leaf modules into the file that already owns them (only importer) ─
const seen = new Set();
for (const file of allFiles) {
  const intoRel = rel(file);
  if (intoRel.includes("__tests__")) continue;
  if (isBarrelIndex(file)) continue;
  const dir = path.dirname(file);
  const code = fs.readFileSync(file, "utf8");
  const locals = localImports(code, dir);
  const from = [];
  let combined = linesByRel.get(intoRel) || 0;

  for (const depAbs of locals) {
    const depRel = rel(depAbs);
    if (path.dirname(depAbs) !== dir) continue;
    if (SKIP_FILES.has(basename(depAbs))) continue;
    if (soleImporter(depRel) !== intoRel) continue;
    const depLines = linesByRel.get(depRel) || 0;
    if (depLines > MAX_LEAF_LINES) continue;
    if (isReexportOnly(fs.readFileSync(depAbs, "utf8"))) continue;
    from.push(depRel);
    combined += depLines;
  }

  if (!from.length || combined > MAX_COMBINED_LINES) continue;

  const key = `${intoRel}|${from.slice().sort().join(",")}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const names = from.map(basename).join(", ");
  const reason =
    from.length === 1
      ? `only \`${basename(intoRel)}\` uses \`${names}\` — one file is simpler than two`
      : `only \`${basename(intoRel)}\` uses these ${from.length} helpers — fold into it, don't add a new file`;

  add(intoRel, from, reason, combined, "high");
}

// ── 2. types.js only used by one sibling → that sibling ─────────────────────
for (const file of allFiles) {
  const typesRel = rel(file);
  if (basename(file) !== "types.js") continue;
  const typesLines = linesByRel.get(typesRel) || 0;
  if (typesLines > 40) continue;
  const intoRel = soleImporter(typesRel);
  if (!intoRel || path.dirname(path.join(ROOT, intoRel)) !== path.dirname(file)) continue;
  const combined = typesLines + (linesByRel.get(intoRel) || 0);
  if (combined > MAX_COMBINED_LINES) continue;
  const key = `types|${intoRel}|${typesRel}`;
  if (seen.has(key)) continue;
  seen.add(key);
  add(
    intoRel,
    [typesRel],
    `\`types.js\` is tiny and only used here — move types into this file`,
    combined,
    "medium",
  );
}

// ── 3. Same-stem split (Picker.jsx + pickerItems.js) → larger file ──────────
const byDir = new Map();
for (const file of allFiles) {
  const r = rel(file);
  const dir = path.dirname(r);
  if (!byDir.has(dir)) byDir.set(dir, []);
  byDir.get(dir).push(r);
}

for (const [, files] of byDir) {
  if (files.length < 2) continue;
  const stems = new Map();
  for (const f of files) {
    const base = path.basename(f, path.extname(f));
    const stem = base.replace(/(Utils|Helpers|Items|Fields|Config|Constants)$/i, "").toLowerCase();
    if (stem.length < 4) continue;
    if (!stems.has(stem)) stems.set(stem, []);
    stems.get(stem).push(f);
  }
  for (const group of stems.values()) {
    if (group.length !== 2) continue;
    const sorted = group.slice().sort((a, b) => (linesByRel.get(b) || 0) - (linesByRel.get(a) || 0));
    const fromRel = sorted[1];
    if ((linesByRel.get(fromRel) || 0) > MAX_LEAF_LINES) continue;
    const owner = soleImporter(fromRel);
    if (!owner) continue;
    const intoRel = owner;
    const combined = (linesByRel.get(intoRel) || 0) + (linesByRel.get(fromRel) || 0);
    if (combined > MAX_COMBINED_LINES) continue;
    const key = `stem|${intoRel}|${fromRel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    add(
      intoRel,
      [fromRel],
      `same feature split across two files — combine in \`${basename(intoRel)}\``,
      combined,
      "medium",
    );
  }
}

// ── 4. Route re-export shells — delete wrapper, route to real page (no new file) ─
const pagesDir = path.join(SRC, "pages");
if (fs.existsSync(pagesDir)) {
  const thin = fs
    .readdirSync(pagesDir)
    .filter((f) => f.endsWith(".jsx"))
    .map((f) => path.join(pagesDir, f))
    .filter((p) => {
      const n = lineCount(p);
      return n <= MAX_REEXPORT_LINES && isReexportOnly(fs.readFileSync(p, "utf8"));
    })
    .map(rel);

  if (thin.length >= 4) {
    add(
      "App.jsx routes (import real pages directly)",
      thin,
      `${thin.length} files in src/pages/ only re-export — point routes at ui/features/pages/* and delete these wrappers (saves hops, no new file)`,
      thin.reduce((s, f) => s + (linesByRel.get(f) || 0), 0),
      "low",
    );
  }
}

// Dedupe: if B→A already covered by A importing B in rule 1, drop stem/overlap duplicate
function fromKey(s) {
  return `${s.into}|${s.from.slice().sort().join(",")}`;
}
const deduped = new Map();
for (const s of suggestions) {
  const k = fromKey(s);
  const prev = deduped.get(k);
  if (!prev || (s.priority === "high" && prev.priority !== "high")) deduped.set(k, s);
}
const items = [...deduped.values()].sort((a, b) => {
  const order = { high: 0, medium: 1, low: 2 };
  return order[a.priority] - order[b.priority] || a.lines - b.lines;
});

const summary = {
  total: items.length,
  high: items.filter((s) => s.priority === "high").length,
  items,
};

function formatAction(s) {
  const intoLabel = s.into.includes("/") ? basename(s.into) : s.into;
  if (s.from.length === 1) {
    return `Merge \`${basename(s.from[0])}\` → \`${intoLabel}\``;
  }
  const list = s.from.map((f) => `\`${basename(f)}\``).join(", ");
  return `Merge ${list} → \`${intoLabel}\``;
}

if (JSON_OUT) {
  console.log(JSON.stringify(summary));
  process.exit(0);
}

if (LIST || items.length) {
  console.log(`\nMerge suggestions — ${items.length} (fold into one file; advisory)\n`);
  if (!items.length) {
    console.log("  Nothing worth merging right now — tree looks fine.\n");
  } else {
    items.forEach((s, i) => {
      console.log(`  ${i + 1}. ${formatAction(s)}`);
      console.log(`     ${s.reason} (~${s.lines} lines combined)`);
      console.log(`     ${s.into}`);
      if (s.from.length) console.log(`     ← ${s.from.join(", ")}`);
      console.log("");
    });
  }
}

process.exit(0);

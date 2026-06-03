#!/usr/bin/env node
/**
 * Enforces: visual UI only under src/ui/
 * Outside src/ui/: className may only use ct-* tokens (no Tailwind color/layout utilities).
 */
import fs from "fs";
import path from "path";

const SRC = path.resolve("src");
const UI_DIR = path.join(SRC, "ui");

const FORBIDDEN_OUTSIDE_UI = [
  /\bfos-/,
  /\bbg-(white|gray|slate|indigo|violet|emerald|amber|red|rose|sky|teal|yellow|orange|green|blue|lime|cyan|stone)-/,
  /\btext-(white|gray|slate|indigo|violet|emerald|amber|red|rose|sky|teal|yellow|orange|green|blue|lime|cyan|stone)-/,
  /\bborder-(gray|slate|indigo|violet|emerald|amber|red|rose)-/,
  /\bfrom-indigo-|\bto-violet-|\bring-indigo-/,
  /\bdark:bg-|\bdark:text-|\bdark:border-/,
  /\brounded-(xl|2xl|3xl|lg|md)\b/,
  /\bshadow-(sm|md|lg|xl)\b/,
  /\bfont-display\b/,
  /const inputClass\s*=/,
  /w-full px-[34] py-[23][^\n]*rounded-xl/,
];

const ALLOWED_CT_ONLY = /^[\s\w\-:!#\[\]()%.,'"`$>={}|@*~+/\\]*$/;

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(jsx|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function isUnderUi(file) {
  return file.startsWith(UI_DIR + path.sep) || file === UI_DIR;
}

const violations = [];
const dupReexports = [];

for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).replace(/\\/g, "/");
  const code = fs.readFileSync(file, "utf8");

  if (/components\/(Card|Modal|Navbar|ToolWidget)\.jsx$/.test(rel)) {
    dupReexports.push(rel);
  }

  if (isUnderUi(file)) continue;
  if (rel.startsWith("engines/")) continue;

  for (const re of FORBIDDEN_OUTSIDE_UI) {
    if (re.test(code)) {
      violations.push({ rel, rule: re.source });
      break;
    }
  }

  const classMatches = code.matchAll(/className\s*=\s*(?:{[^}]*?[`'"]([^`'"]+)[`'"]|["']([^"']+)["'])/g);
  for (const m of classMatches) {
    const cls = (m[1] || m[2] || "").trim();
    if (!cls) continue;
    const tokens = cls.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      if (t.startsWith("ct-")) continue;
      if (["flex", "grid", "min-w-0", "shrink-0", "truncate", "block", "inline", "hidden", "sr-only", "no-scrollbar"].includes(t)) continue;
      if (/^(items-|justify-|gap-|col-|row-|flex-|w-|h-|max-|min-|overflow|relative|absolute|fixed|inset|z-|opacity-|animate-|transition)/.test(t)) {
        violations.push({ rel, rule: `non-ct class: ${t}`, sample: cls.slice(0, 80) });
        break;
      }
      if (/^(bg-|text-|border-|rounded|shadow|ring|from-|to-|dark:)/.test(t)) {
        violations.push({ rel, rule: `tailwind visual: ${t}`, sample: cls.slice(0, 80) });
        break;
      }
    }
  }
}

const unique = [...new Map(violations.map((v) => [`${v.rel}:${v.rule}`, v])).values()];

const report = {
  violations: unique.length,
  duplicateReexports: dupReexports.length,
  items: unique,
  shims: dupReexports,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report));
  process.exit(report.violations || report.duplicateReexports ? 1 : 0);
}

console.log(`UI audit: ${unique.length} violation(s), ${dupReexports.length} duplicate re-export(s)\n`);

if (dupReexports.length) {
  console.log("Remove duplicate re-exports (import from src/ui instead):");
  dupReexports.forEach((r) => console.log(`  - ${r}`));
}

if (unique.length) {
  unique.sort((a, b) => a.rel.localeCompare(b.rel));
  for (const v of unique.slice(0, 40)) {
    console.log(`  ${v.rel}: ${v.rule}${v.sample ? ` (${v.sample})` : ""}`);
  }
  if (unique.length > 40) console.log(`  ... and ${unique.length - 40} more`);
  process.exit(1);
}

if (dupReexports.length) process.exit(1);

console.log("OK — UI is confined to src/ui/ and ct-* layout classes outside it.");

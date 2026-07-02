#!/usr/bin/env node
/**
 * scripts/audit-fix.mjs
 *
 * Self-healing audit runner. Finds issues, auto-fixes what is safe,
 * reports what needs human review.
 *
 * Usage:
 *   npm run audit:fix                        scan only, print report
 *   npm run audit:fix -- --apply             auto-fix all safe issues
 *   npm run audit:fix -- --category=buttons  one category only
 *   npm run audit:fix -- --json              machine-readable JSON output
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = join(fileURLToPath(import.meta.url), "..");
const ROOT = join(__dirname, "..");
const SRC  = join(ROOT, "src");

const args     = process.argv.slice(2);
const APPLY    = args.includes("--apply");
const JSON_OUT = args.includes("--json");
const CAT      = (args.find(a => a.startsWith("--category=")) || "").replace("--category=", "") || "all";

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  cyan: "\x1b[36m", gray: "\x1b[90m",
};
const p = (c, t) => `${c}${t}${C.reset}`;

function walk(dir, out = [], ext = /\.(jsx|js)$/) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) walk(full, out, ext);
    else if (ext.test(f)) out.push(full);
  }
  return out;
}

function rel(f) { return relative(ROOT, f); }

/** Issue shape: { category, file, line, message, autofixable, fix? } */
const issues = [];

function issue(category, file, line, message, autofixable, fix) {
  issues.push({ category, file: rel(file), line, message, autofixable, fix: fix || null });
}

// ════════════════════════════════════════════
// CATEGORY: buttons — missing type attribute
// ════════════════════════════════════════════
function auditButtons() {
  for (const file of walk(SRC)) {
    const code = readFileSync(file, "utf8");
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      if (/<button(?=[^>]*>)(?![^>]*\btype\s*=)/.test(line)) {
        issue("buttons", file, i + 1,
          `<button> missing type= (defaults to type="submit" in forms)`,
          true,
          () => {
            const fixed = code.replace(
              /<button(?=[^>]*>)(?![^>]*\btype\s*=)(\s)/g,
              '<button type="button"$1'
            );
            if (fixed !== code) writeFileSync(file, fixed);
          }
        );
      }
    });
  }
}

// ════════════════════════════════════════════
// CATEGORY: a11y — accessibility issues
// ════════════════════════════════════════════
function auditA11y() {
  const UI = join(SRC, "ui");
  for (const file of walk(UI, [], /\.jsx$/)) {
    const code = readFileSync(file, "utf8");
    const lines = code.split("\n");
    lines.forEach((line, i) => {
      // img without alt
      if (/<img\b/.test(line) && !/\balt\s*=/.test(line)) {
        issue("a11y", file, i + 1, "<img> without alt attribute", false);
      }
      // clickable div without role
      if (/<div[^>]+onClick\s*=/.test(line) && !/role\s*=/.test(line) && !/tabIndex/.test(line)) {
        issue("a11y", file, i + 1, "onClick on <div> without role/tabIndex — use <button>", false);
      }
      // icon-only button without aria-label
      if (/<button[^>]*>[\s\n]*<(CtIcon|svg)/.test(line) && !/aria-label/.test(line)) {
        issue("a11y", file, i + 1, "Icon-only <button> needs aria-label", false);
      }
    });
  }
}

// ════════════════════════════════════════════
// CATEGORY: duplicates — repeated helper fns
// ════════════════════════════════════════════
function auditDuplicates() {
  const seen = {};
  const TRACK = [
    { name: "daysUntil", pattern: /function daysUntil\s*\(/ },
    { name: "wealthCategoryLabel", pattern: /function wealthCategoryLabel\s*\(/ },
    { name: "formatInr", pattern: /toLocaleString\(['"](en-IN)['"]\)/ },
    { name: "formatAmount (inline ₹)", pattern: /`₹\$\{[^}]+toLocaleString/ },
  ];
  for (const file of walk(SRC)) {
    const code = readFileSync(file, "utf8");
    for (const { name, pattern } of TRACK) {
      if (pattern.test(code)) {
        seen[name] = seen[name] || [];
        seen[name].push(rel(file));
      }
    }
  }
  for (const [name, files] of Object.entries(seen)) {
    if (files.length > 1) {
      issue("duplicates", join(ROOT, files[0]), null,
        `"${name}" defined/used in ${files.length} places: ${files.join(", ")} — centralise in utils/`,
        false
      );
    }
  }
}

// ════════════════════════════════════════════
// CATEGORY: dead-code — unused imports, deferred features in bundle
// ════════════════════════════════════════════
function auditDeadCode() {
  // governance/ in src/ (should be in scripts/)
  const govDir = join(SRC, "governance");
  if (existsSync(govDir)) {
    let usedInApp = false;
    for (const file of walk(SRC)) {
      if (file.includes("governance")) continue;
      if (/from.*governance/.test(readFileSync(file, "utf8"))) {
        usedInApp = true;
        break;
      }
    }
    if (!usedInApp) {
      issue("dead-code", govDir, null,
        "src/governance/ registries are only used by scripts/ — move them out of the app bundle",
        false
      );
    }
  }

  // Duplicate SCHEMA_VERSION_KEY export
  const migrateFile = join(SRC, "utils", "migrateStorage.js");
  if (existsSync(migrateFile)) {
    const code = readFileSync(migrateFile, "utf8");
    const count = (code.match(/export const SCHEMA_VERSION_KEY/g) || []).length;
    if (count > 1) {
      issue("dead-code", migrateFile, null,
        `SCHEMA_VERSION_KEY exported ${count} times — remove the duplicate`,
        true,
        () => {
          let seen = false;
          const fixed = code.replace(
            /export const SCHEMA_VERSION_KEY = [^\n]+\n/g,
            (m) => { if (!seen) { seen = true; return m; } return ""; }
          );
          writeFileSync(migrateFile, fixed);
        }
      );
    }
  }
}

// ════════════════════════════════════════════
// CATEGORY: error-boundaries — routes without boundaries
// ════════════════════════════════════════════
function auditErrorBoundaries() {
  const appFile = join(SRC, "App.jsx");
  if (!existsSync(appFile)) return;
  const code = readFileSync(appFile, "utf8");
  const routes = [...code.matchAll(/<Route\s+path="([^"]+)"/g)].map(m => m[1]);
  const lazy   = [...code.matchAll(/const (\w+) = lazy\(/g)].map(m => m[1]);
  lazy.forEach(component => {
    // Check if this component appears wrapped in RouteErrorBoundary
    const inBoundary = new RegExp(`RouteErrorBoundary[^>]*>[\\s\\S]{0,200}${component}`).test(code);
    if (!inBoundary) {
      issue("error-boundaries", appFile, null,
        `Lazy component "${component}" is not wrapped in RouteErrorBoundary — one crash will unmount the whole app`,
        false
      );
    }
  });
}

// ════════════════════════════════════════════
// CATEGORY: large-files — files over 500 lines
// ════════════════════════════════════════════
function auditLargeFiles() {
  const SKIP = /i18n\/messages\//;
  for (const file of walk(SRC)) {
    if (SKIP.test(rel(file))) continue;
    const lines = readFileSync(file, "utf8").split("\n").length;
    if (lines >= 800) {
      issue("large-files", file, null,
        `${lines} lines — consider splitting. Files over 800 lines are hard to review and test.`,
        false
      );
    } else if (lines >= 500) {
      issue("large-files", file, null,
        `${lines} lines — approaching the maintainability limit. Split when adding next feature.`,
        false
      );
    }
  }
}

// ════════════════════════════════════════════
// CATEGORY: types — missing JSDoc on critical engines
// ════════════════════════════════════════════
function auditTypes() {
  const CRITICAL = [
    "perovoScore.js", "pressureScore.js", "survival.js",
    "incomeTaxEstimate.js", "safeToSpend.js", "affordability.js",
    "burden.js", "forecast.js", "lendingTrust.js", "emergencyFund.js",
  ];
  const engineDir = join(SRC, "engines");
  for (const name of CRITICAL) {
    const file = join(engineDir, name);
    if (!existsSync(file)) continue;
    const code = readFileSync(file, "utf8");
    if (!/@param\s*\{/.test(code)) {
      issue("types", file, 1,
        `No JSDoc @param types on ${name} — financial calculations should document expected input types`,
        false
      );
    }
  }
}

// ════════════════════════════════════════════
// RUN
// ════════════════════════════════════════════
const CATEGORIES = {
  buttons: auditButtons,
  a11y: auditA11y,
  duplicates: auditDuplicates,
  "dead-code": auditDeadCode,
  "error-boundaries": auditErrorBoundaries,
  "large-files": auditLargeFiles,
  types: auditTypes,
};

if (CAT === "all") {
  Object.values(CATEGORIES).forEach(fn => fn());
} else if (CATEGORIES[CAT]) {
  CATEGORIES[CAT]();
} else {
  console.error(`Unknown category: ${CAT}`);
  console.error(`Available: ${Object.keys(CATEGORIES).join(", ")}`);
  process.exit(1);
}

// Auto-fix pass
let fixed = 0;
if (APPLY) {
  for (const issue of issues) {
    if (issue.autofixable && issue.fix) {
      try {
        issue.fix();
        fixed++;
        if (!JSON_OUT) console.log(p(C.green, `  ✓ fixed`), issue.message, p(C.gray, issue.file));
      } catch (e) {
        if (!JSON_OUT) console.log(p(C.red, `  ✗ failed`), issue.message, String(e));
      }
    }
  }
}

// Output
if (JSON_OUT) {
  console.log(JSON.stringify({ issues, fixed, total: issues.length }, null, 2));
} else {
  const auto  = issues.filter(i => i.autofixable);
  const manual = issues.filter(i => !i.autofixable);

  console.log(`\n${p(C.bold, "Perovo audit:fix")} — ${issues.length} issues found\n`);

  if (auto.length) {
    console.log(p(C.cyan, `  Auto-fixable (${auto.length}):`));
    auto.forEach(i => {
      const mark = APPLY ? p(C.green, "✓") : p(C.yellow, "→");
      console.log(`  ${mark} [${i.category}] ${i.message}`);
      console.log(`     ${p(C.gray, i.file)}${i.line ? `:${i.line}` : ""}`);
    });
  }

  if (manual.length) {
    console.log(p(C.yellow, `\n  Manual review (${manual.length}):`));
    manual.forEach(i => {
      console.log(`  ${p(C.yellow, "⚠")} [${i.category}] ${i.message}`);
      console.log(`     ${p(C.gray, i.file)}${i.line ? `:${i.line}` : ""}`);
    });
  }

  if (APPLY && fixed > 0) {
    console.log(`\n${p(C.green, `✓ Auto-fixed ${fixed} issues`)}\n`);
  } else if (!APPLY && auto.length > 0) {
    console.log(`\n  Run ${p(C.cyan, "npm run audit:fix -- --apply")} to auto-fix ${auto.length} issues\n`);
  }
}

process.exit(issues.filter(i => i.category === "buttons" && !APPLY).length > 0 ? 1 : 0);

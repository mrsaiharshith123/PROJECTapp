#!/usr/bin/env node
/**
 * Find locale strings that still match English (untranslated fallbacks).
 *   npm run audit:i18n:fallback
 *   node scripts/audit-i18n-fallback.mjs --strict
 */
import fs from "fs";
import vm from "vm";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src/i18n/messages");

/** Keys allowed to stay identical to English in every locale (symbols, acronyms). */
const ALLOW_IDENTICAL = new Set([
  "brand.proSuffix",
  "plans.pro",
  "plans.power",
  "support.contactEmail",
  "account.panPlaceholder",
]);

function loadLocale(filePath) {
  let source = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").replace(/export\s+default/, "module.exports =");
  const context = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(source, context, { filename: filePath });
  return context.module.exports;
}

const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const LIST = args.includes("--list");
const JSON_OUT = args.includes("--json");

const en = loadLocale(path.join(MESSAGES_DIR, "en.js"));
const enKeys = Object.keys(en);
const locales = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".js") && f !== "en.js");

/** @type {{ locale: string, identical: number, total: number, samples: string[] }[]} */
const report = [];

for (const file of locales.sort()) {
  const code = file.replace(/\.js$/, "");
  const messages = loadLocale(path.join(MESSAGES_DIR, file));
  const identical = [];
  for (const key of enKeys) {
    if (ALLOW_IDENTICAL.has(key)) continue;
    if (messages[key] === en[key]) identical.push(key);
  }
  report.push({
    locale: code,
    identical: identical.length,
    total: enKeys.length,
    samples: identical.slice(0, 8),
  });
}

const totalIdentical = report.reduce((s, r) => s + r.identical, 0);
const worst = report.reduce((a, b) => (b.identical > a.identical ? b : a), report[0]);

if (JSON_OUT) {
  console.log(JSON.stringify({ totalIdentical, report }));
  process.exit(STRICT && totalIdentical > 0 ? 1 : 0);
}

console.log("i18n English-fallback audit (values identical to en.js)\n");
for (const row of report) {
  const pct = ((row.identical / row.total) * 100).toFixed(1);
  console.log(`  ${row.locale}: ${row.identical}/${row.total} (${pct}%) still English`);
  if (LIST && row.samples.length) {
    for (const k of row.samples) console.log(`    - ${k}`);
  }
}
console.log(`\n  Total untranslated slots: ${totalIdentical}`);
console.log(`  Run: npm run i18n:translate:all\n`);

if (STRICT && totalIdentical > 50) {
  console.log(`  FAIL — ${worst.locale} has ${worst.identical} English fallbacks (strict threshold 50)`);
  process.exit(1);
}

console.log(STRICT ? "  PASS (under strict threshold)" : "  Advisory only (use --strict to fail CI)");
process.exit(0);

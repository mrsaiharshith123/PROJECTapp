#!/usr/bin/env node
/**
 * docs/09-implementation-status.md should reflect shipped routes/features.
 *   npm run audit:docs-sync
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC = path.join(ROOT, "docs/09-implementation-status.md");
const JSON_OUT = process.argv.includes("--json");

const MUST_NOT_SAY_DEFERRED = [
  { pattern: /Paycheck page.*deferred|paycheck.*deferred/i, note: "Paycheck is shipped — remove deferred wording" },
  { pattern: /salaryCreditDay.*no Profile UI/i, note: "salaryCreditDay has Profile UI — update doc" },
  { pattern: /\b264\b unit tests/i, note: "Test count stale — run npm test and update" },
];

const MUST_EXIST = [
  { pattern: /\/paycheck/, note: "Document /paycheck route" },
  { pattern: /billHealth|bill health/i, note: "Document bill health feature" },
  { pattern: /caExport|CA export/i, note: "Document CA export" },
];

function main() {
  const text = fs.readFileSync(DOC, "utf8");
  const hits = [];

  for (const rule of MUST_NOT_SAY_DEFERRED) {
    if (rule.pattern.test(text)) hits.push({ type: "stale", note: rule.note });
  }
  for (const rule of MUST_EXIST) {
    if (!rule.pattern.test(text)) hits.push({ type: "missing", note: rule.note });
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: hits.length, items: hits }));
    process.exit(hits.length ? 1 : 0);
  }

  if (!hits.length) {
    console.log("Docs sync: implementation status doc looks current.");
    process.exit(0);
  }

  console.log(`Docs sync — ${hits.length} issue(s):\n`);
  hits.forEach((h) => console.log(`  • ${h.note}`));
  process.exit(1);
}

main();

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
  { pattern: /\b322\b unit tests/i, note: "Test count stale — run npm test and update" },
  { pattern: /\b336\b unit tests/i, note: "Test count stale — run npm test and update" },
  { pattern: /\b352\b unit tests/i, note: "Test count stale — run npm test and update" },
  { pattern: /\b358\b unit tests/i, note: "Test count stale — run npm test and update" },
  { pattern: /\b366\b unit tests/i, note: "Test count stale — run npm test and update" },
  { pattern: /\b373\b unit tests/i, note: "Test count stale — run npm test and update" },
  { pattern: /\b81\/81\b engine modules/i, note: "Engine test count stale — run audit:engine-tests" },
  { pattern: /\b86\/86\b engine modules/i, note: "Engine test count stale — run audit:engine-tests" },
  { pattern: /FamilyCommandCenter\.jsx.*Home|Family command center \(Home\)/i, note: "FamilyCommandCenter removed from Home — use HouseholdCommandPanel" },
  { pattern: /HouseholdHubSection/i, note: "HouseholdHubSection removed — use HouseholdCommandPanel on Analytics" },
  { pattern: /SubscriptionsAuditPanel/i, note: "SubscriptionsAuditPanel removed — delete from status doc" },
  { pattern: /dependents.*max 6|max 6 people/i, note: "Seat limit is householdMemberLimit (2–20), not dependents cap" },
  { pattern: /Profile dependents field/i, note: "Dependents edited via HouseholdDependentsEditorModal, not Profile" },
];

const MUST_EXIST = [
  { pattern: /\/paycheck/, note: "Document /paycheck route" },
  { pattern: /billHealth|bill health/i, note: "Document bill health feature" },
  { pattern: /caExport|CA export/i, note: "Document CA export" },
  { pattern: /householdRoom|HouseholdCommandPanel|household rooms/i, note: "Document household rooms / command panel" },
  { pattern: /resolveDataProfileScope|household combined/i, note: "Document family household data scope" },
  { pattern: /HouseholdDependentsEditorModal|HouseholdFamilyBadge/i, note: "Document household dependents editor + badge" },
  { pattern: /122.*test|test.*122/i, note: "Document current chaos QA test count (122)" },
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

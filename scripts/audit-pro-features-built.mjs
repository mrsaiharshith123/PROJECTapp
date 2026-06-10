#!/usr/bin/env node
/**
 * Pro/Power features in registry should have real UI paths, not tier defs only.
 *   npm run audit:pro-features-built
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const JSON_OUT = process.argv.includes("--json");

const CHECKS = [
  { id: "multiple_profiles", paths: ["src/ui/features/profile/ProfileManager.jsx"] },
  { id: "ca_share", paths: ["src/engines/caExport.js", "src/ui/features/profile/ProfileBackupSection.jsx"] },
  { id: "ai_advisor", paths: ["src/services/financialAdvisor.js", "supabase/functions/financial-advisor/index.ts"] },
  { id: "subscription_leak", paths: ["src/engines/subscriptionLeak.js", "src/ui/features/analytics/SubscriptionsAuditPanel.jsx"] },
];

function main() {
  const hits = [];
  for (const c of CHECKS) {
    for (const rel of c.paths) {
      const p = path.join(ROOT, rel);
      if (!fs.existsSync(p)) hits.push({ feature: c.id, path: rel });
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: hits.length, items: hits }));
    process.exit(hits.length ? 1 : 0);
  }

  if (!hits.length) {
    console.log("Pro features built: key Power/Pro surfaces exist.");
    process.exit(0);
  }

  console.log(`Pro features built — ${hits.length} missing path(s):\n`);
  hits.forEach((h) => console.log(`  • ${h.feature}: ${h.path}`));
  process.exit(1);
}

main();

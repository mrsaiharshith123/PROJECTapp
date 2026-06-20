#!/usr/bin/env node
/**
 * Human-readable summary of governance health (from report file or live scan).
 *   npm run audit:summary
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const reportPath = path.join(ROOT, "reports/governance-latest.json");

function loadReport() {
  if (fs.existsSync(reportPath)) {
    try {
      return JSON.parse(fs.readFileSync(reportPath, "utf8"));
    } catch {
      /* fall through */
    }
  }
  const r = spawnSync("node", ["scripts/audit-runner.mjs", "--gov", "--quick", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  try {
    return JSON.parse((r.stdout || "").trim() || "{}");
  } catch {
    return null;
  }
}

const data = loadReport();
if (!data?.audits) {
  console.log("No governance data — run: npm run audit:report");
  process.exit(1);
}

console.log("\nPerovo governance summary\n");
console.log(`  Generated: ${data.generatedAt || "live"}`);
console.log(`  Mode:      ${data.mode || "?"}`);
console.log(
  `  Health:    ${data.totals?.errors ?? 0} errors · ${data.totals?.warnings ?? 0} warnings · ${data.totals?.advisories ?? 0} advisories\n`,
);

const failing = data.audits.filter((a) => a.errors > 0);
const warning = data.audits.filter((a) => a.errors === 0 && a.warnings > 0);

if (failing.length) {
  console.log("  Must fix:");
  for (const a of failing) {
    console.log(`    ✗ ${a.title} (${a.errors} error(s))`);
  }
  console.log("");
}

if (warning.length) {
  console.log("  Review:");
  for (const a of warning.slice(0, 6)) {
    console.log(`    ! ${a.title} (${a.warnings} warning(s), ${a.advisories} advisory)`);
  }
  if (warning.length > 6) console.log(`    … +${warning.length - 6} more audits with warnings`);
  console.log("");
}

const clean = data.audits.filter((a) => a.errors === 0 && a.warnings === 0);
console.log(`  Clean: ${clean.length}/${data.audits.length} audit(s)`);
console.log("\n  Next: npm run audit  (full production gate)\n");
process.exit(data.totals?.errors > 0 ? 1 : 0);

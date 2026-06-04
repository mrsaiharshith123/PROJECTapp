#!/usr/bin/env node
/**
 * Write developer governance report JSON.
 *   npm run audit:report
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const outDir = path.join(ROOT, "reports");
const outFile = path.join(outDir, "governance-latest.json");
const full = process.argv.includes("--full");

const args = ["scripts/audit-runner.mjs", "--gov", "--json"];
if (full) args.push("--with-legacy");
else args.push("--quick");

const r = spawnSync("node", args, {
  cwd: ROOT,
  encoding: "utf8",
  shell: true,
  maxBuffer: 30 * 1024 * 1024,
});

let payload = {};
try {
  payload = JSON.parse((r.stdout || "").trim() || "{}");
} catch {
  payload = { parseError: true, raw: (r.stdout || "").slice(0, 500) };
}

payload.exitCode = r.status ?? 1;
payload.writtenTo = path.relative(ROOT, outFile);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));

console.log(`Governance report → ${payload.writtenTo}`);
console.log(
  `  ${payload.totals?.errors ?? "?"} errors, ${payload.totals?.warnings ?? "?"} warnings, ${payload.totals?.advisories ?? "?"} advisories`,
);
console.log("  View: npm run audit:summary");
process.exit(payload.exitCode === 0 ? 0 : 1);

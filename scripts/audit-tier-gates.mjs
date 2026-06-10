#!/usr/bin/env node
/**
 * Find Pro/Power feature ids declared in subscriptionTiers without UI gates.
 *   npm run audit:tier
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const JSON_OUT = process.argv.includes("--json");

/** Features that are enforced outside ProGate (tierAccess, hooks, etc.) */
const ENFORCED_ELSEWHERE = new Set([
  "account_backup",
  "health_report",
  "unlimited_lending",
  "legal_agreement",
  "cashflow_90d",
  "bank_import",
  "subscription_leak",
  "lifestyle_inflation",
  "unlimited_goals",
  "unlimited_daily_spend",
  "unlimited_bill_split",
  "unlimited_chits",
  "multiple_profiles",
  "ca_share",
]);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "__tests__") continue;
      walk(p, acc);
    } else if (/\.(js|jsx)$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

async function loadFeatureIds() {
  const mod = await import(pathToFileURL(path.join(SRC, "constants/subscriptionTiers.js")).href);
  return [...new Set([...mod.PRO_FEATURES, ...mod.POWER_FEATURES])];
}

async function main() {
  const featureIds = await loadFeatureIds();
  const uiFiles = walk(path.join(SRC, "ui"));
  const uiCode = uiFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const tierAccessCode = fs.readFileSync(path.join(SRC, "utils/tierAccess.js"), "utf8");
  const hooksCode = walk(path.join(SRC, "hooks")).map((f) => fs.readFileSync(f, "utf8")).join("\n");

  const servicesCode = walk(path.join(SRC, "services"))
    .map((f) => fs.readFileSync(f, "utf8"))
    .join("\n");
  const featureRef = (code, fid) =>
    code.includes(`"${fid}"`) || code.includes(`'${fid}'`);

  const ungated = [];
  for (const id of featureIds) {
    if (ENFORCED_ELSEWHERE.has(id)) continue;
    const inProGate = uiCode.includes(`featureId="${id}"`) || uiCode.includes(`featureId={'${id}'}`);
    const inTierAccess = featureRef(tierAccessCode, id);
    const inHooks = featureRef(hooksCode, id);
    const inUiTier = featureRef(uiCode, id);
    const inServices = featureRef(servicesCode, id);
    if (!inProGate && !inTierAccess && !inHooks && !inUiTier && !inServices) {
      ungated.push(id);
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: ungated.length, items: ungated }));
    process.exit(ungated.length ? 1 : 0);
  }

  if (!ungated.length) {
    console.log("Tier gates: all declared UI features are enforced.");
    process.exit(0);
  }

  console.log(`Tier gates — ${ungated.length} feature id(s) without ProGate/tierAccess/hook enforcement:\n`);
  ungated.forEach((id) => console.log(`  • ${id}`));
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

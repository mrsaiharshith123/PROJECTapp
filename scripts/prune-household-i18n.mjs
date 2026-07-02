#!/usr/bin/env node
/**
 * Remove household / family-mode i18n keys from en.js, then run sync:i18n.
 *   node scripts/prune-household-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EN_PATH = path.join(__dirname, "../src/i18n/messages/en.js");

/** @param {string} key */
function shouldPruneKey(key) {
  if (/household/i.test(key)) return true;
  if (/^family\./i.test(key)) return true;
  if (/\.family\./i.test(key)) return true;
  if (key === "mode.family") return true;
  if (key === "brand.familySuffix") return true;
  if (/^profile\.family/i.test(key)) return true;
  if (/^home\.strip\.family/i.test(key)) return true;
  if (key === "home.statusTile.familyTitle") return true;
  if (key.startsWith("goals.forMember.")) return true;
  if (key === "goals.forMemberLabel") return true;
  if (key.startsWith("add.forMember.")) return true;
  if (key === "help.householdPayerBillTag") return true;
  if (key === "commitment.edit.payerUntagged") return true;
  if (key === "plans.feature.power.household") return true;
  if (/Household/i.test(key)) return true;
  if (/^insight\.family-/i.test(key)) return true;
  if (key === "settings.value.family") return true;
  if (key === "narrative.headline.family") return true;
  if (/^guidance\.[^.]*household/i.test(key)) return true;
  return false;
}

function serializeLocale(messages) {
  const lines = ["export default {"];
  for (const [key, value] of Object.entries(messages)) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(String(value))},`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

async function main() {
  const mod = await import(pathToFileURL(EN_PATH).href);
  const en = mod.default;
  const before = Object.keys(en).length;
  const pruned = {};
  const removed = [];

  for (const [key, value] of Object.entries(en)) {
    if (shouldPruneKey(key)) {
      removed.push(key);
      continue;
    }
    let next = value;
    if (key === "mode.salariedDesc") {
      next = "Salary, EMIs, and subscriptions for salaried life.";
    } else if (key === "guide.setup.subtitle") {
      next = "Review how you use Perovo and update income basics. Your bills stay as they are.";
    } else if (key === "support.aboutBody") {
      next = "Perovo helps Indian salaried users track bills, lending, and monthly pressure — a product of Tadsaya, on your device.";
    } else if (key === "auth.tagline") {
      next = "Bills, pressure, lending & salary cashflow — on your device.";
    } else if (key === "proGate.powerHint") {
      next = "A Power subscription unlocks bond analysis, CA-ready exports, and advanced tools.";
    } else if (key === "tier.limit.profilesMessage") {
      next = "Upgrade to Power to add optional profiles for separate bill tracking.";
    } else if (key === "plans.tagline.power") {
      next = "Power-tier tools & CA-ready exports";
    } else if (key === "plans.feature.power.profiles") {
      next = "Optional bill-tracking profiles";
    } else if (key === "stability.headline.dualIncome" || key === "insight.dual-income") {
      next = "You rely on more than one income stream — losing either would raise pressure.";
    } else if (key === "microTip.3") {
      next = "Planning improves when large renewals are visible early.";
    } else if (key === "webLanding.feature.insights.desc" && /family households/i.test(String(value))) {
      next = "Analytics tuned for salaried finances.";
    }
    pruned[key] = next;
  }

  fs.writeFileSync(EN_PATH, serializeLocale(pruned), "utf8");
  console.log(`Pruned ${removed.length} keys from en.js (${before} → ${Object.keys(pruned).length})`);

  const CACHE_PATH = path.join(__dirname, ".i18n-translate-cache.json");
  if (fs.existsSync(CACHE_PATH)) {
    fs.unlinkSync(CACHE_PATH);
    console.log("Deleted scripts/.i18n-translate-cache.json (rebuild: npm run i18n:translate:fast)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

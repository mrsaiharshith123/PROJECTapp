#!/usr/bin/env node
/**
 * Repair locale files corrupted by bad auto-translate (⟦ tokens, '{0}' artifacts).
 * Restores {param} placeholders from en.js for affected keys — all 22 locales.
 *   node scripts/i18n-repair-placeholders.mjs [locale]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src/i18n/messages");

/** Keys that must keep English proper nouns */
const SKIP_REPAIR = new Set(["brand.appName", "brand.tadsayaNote"]);

/** @param {string} file */
async function loadLocale(file) {
  const mod = await import(pathToFileURL(file).href + "?t=" + Date.now());
  return mod.default || mod;
}

/** @param {Record<string, string>} messages */
function serializeLocale(messages) {
  const lines = ["export default {"];
  for (const [key, value] of Object.entries(messages)) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(String(value))},`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

function isCorrupted(value) {
  const s = String(value);
  return (
    /tokens\.push/.test(s) ||
    /__T\d+__/.test(s) ||
    /^\(\)\s*=>/.test(s.trim()) ||
    /⟦|'\{0\}'|\{0\}/.test(s)
  );
}

function needsRepair(value) {
  return isCorrupted(value);
}

async function main() {
  const en = await loadLocale(path.join(MESSAGES_DIR, "en.js"));
  const only = process.argv[2];
  const files = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".js") && f !== "en.js" && (!only || f === `${only}.js`));

  for (const file of files) {
    const filePath = path.join(MESSAGES_DIR, file);
    const messages = await loadLocale(filePath);
    let changed = 0;

    for (const [key, value] of Object.entries(messages)) {
      if (SKIP_REPAIR.has(key)) continue;
      if (needsRepair(value) && en[key]) {
        messages[key] = en[key];
        changed += 1;
      }
    }

    // Reset broken brand byline to English source so auto-translate can re-fill per locale
    if (messages["brand.byTadsaya"] && needsRepair(messages["brand.byTadsaya"])) {
      messages["brand.byTadsaya"] = en["brand.byTadsaya"];
      changed += 1;
    }

    if (changed > 0) {
      fs.writeFileSync(filePath, serializeLocale(messages), "utf8");
      console.log(`Repaired ${file} (${changed} key(s))`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

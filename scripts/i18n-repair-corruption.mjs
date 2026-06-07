#!/usr/bin/env node
/**
 * Fix locale files corrupted by translate-fallback-locales.mjs (.join(callback) bug).
 * Resets corrupted keys to English source; keeps valid non-English translations.
 *   node scripts/i18n-repair-corruption.mjs [locale]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src/i18n/messages");

/** @param {string} value */
function isCorrupted(value) {
  const s = String(value);
  return (
    /tokens\.push/.test(s) ||
    /__T\d+__/.test(s) ||
    /^\(\)\s*=>/.test(s.trim()) ||
    /⟦/.test(s)
  );
}

/** @param {string} file */
async function loadLocale(file) {
  const mod = await import(pathToFileURL(file).href + "?t=" + Date.now());
  return mod.default || mod;
}

/** @param {Record<string, string>} messages @param {string[]} orderedKeys */
function serializeLocale(messages, orderedKeys) {
  const lines = ["export default {"];
  for (const key of orderedKeys) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(String(messages[key] ?? ""))},`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

async function main() {
  const en = await loadLocale(path.join(MESSAGES_DIR, "en.js"));
  const keys = Object.keys(en);
  const only = process.argv[2];
  const files = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".js") && f !== "en.js" && (!only || f === `${only}.js`));

  let totalFixed = 0;
  for (const file of files) {
    const filePath = path.join(MESSAGES_DIR, file);
    const messages = await loadLocale(filePath);
    let fixed = 0;

    for (const key of keys) {
      const value = String(messages[key] ?? "");
      if (isCorrupted(value)) {
        messages[key] = en[key] ?? value;
        fixed += 1;
      }
    }

    if (fixed > 0) {
      fs.writeFileSync(filePath, serializeLocale(messages, keys), "utf8");
      console.log(`Fixed ${file}: ${fixed} corrupted key(s)`);
      totalFixed += fixed;
    }
  }

  console.log(totalFixed ? `\nDone — ${totalFixed} key(s) reset from en.js.` : "\nNo corruption found.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

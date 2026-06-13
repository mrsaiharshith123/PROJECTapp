#!/usr/bin/env node
/**
 * Add missing translation keys to locale files (English fallback value).
 *   node scripts/sync-i18n-keys.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MESSAGES_DIR = path.join(ROOT, "src/i18n/messages");

/** @param {string} file */
async function loadLocale(file) {
  const mod = await import(pathToFileURL(file).href);
  return mod.default || mod;
}

/** @param {Record<string, string>} messages @param {string} [file] */
function serializeLocale(messages, file = "") {
  const headers = {
    "ks.js": "/** Kashmiri (ks) locale — Perovo messages */\n",
    "ur.js": "/** Urdu (ur) locale — Perovo messages */\n",
  };
  const lines = [headers[file] || "", "export default {"].filter(Boolean);
  for (const [key, value] of Object.entries(messages)) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(String(value))},`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

async function main() {
  const en = await loadLocale(path.join(MESSAGES_DIR, "en.js"));
  const sourceKeys = Object.keys(en);
  let updated = 0;

  for (const file of fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".js") && f !== "en.js")) {
    const filePath = path.join(MESSAGES_DIR, file);
    const messages = await loadLocale(filePath);
    let changed = false;
    const pruned = {};
    for (const key of sourceKeys) {
      pruned[key] = key in messages ? messages[key] : en[key];
      if (!(key in messages)) changed = true;
    }
    if (Object.keys(messages).length !== sourceKeys.length) changed = true;
    if (changed) {
      fs.writeFileSync(filePath, serializeLocale(pruned, file), "utf8");
      updated += 1;
      console.log(`Updated ${file}`);
    }
  }

  console.log(updated ? `\nSynced ${updated} locale file(s).` : "\nAll locale files already in sync.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

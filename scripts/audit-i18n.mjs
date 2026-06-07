#!/usr/bin/env node
/**
 * Verify every locale file exports the same keys as English source.
 *
 *   npm run audit:i18n
 *   node scripts/audit-i18n.mjs --json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { listMessageKeys, validateLocaleMessages } from "../src/i18n/translate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MESSAGES_DIR = path.join(ROOT, "src/i18n/messages");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");

/** @param {string} file */
async function loadLocaleModule(file) {
  const mod = await import(pathToFileURL(file).href);
  return mod.default || mod;
}

async function main() {
  const enPath = path.join(MESSAGES_DIR, "en.js");
  const en = await loadLocaleModule(enPath);
  const sourceKeys = listMessageKeys();
  if (sourceKeys.length !== Object.keys(en).length) {
    console.error("listMessageKeys() out of sync with en.js");
    process.exit(1);
  }

  /** @type {{ locale: string, missing: string[], extra: string[] }[]} */
  const problems = [];

  const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".js") && f !== "en.js");

  for (const file of files.sort()) {
    const code = file.replace(/\.js$/, "");
    const messages = await loadLocaleModule(path.join(MESSAGES_DIR, file));
    const result = validateLocaleMessages(code, messages);
    if (!result.complete || result.missing.length) {
      problems.push({ locale: code, missing: result.missing, extra: [] });
    }
    const extra = Object.keys(messages).filter((k) => !(k in en)).sort();
    if (extra.length) {
      const existing = problems.find((p) => p.locale === code);
      if (existing) existing.extra = extra;
      else problems.push({ locale: code, missing: [], extra });
    }
    const corrupted = Object.entries(messages).filter(
      ([, v]) =>
        /tokens\.push/.test(String(v)) ||
        /__T\d+__/.test(String(v)) ||
        /^\(\)\s*=>/.test(String(v).trim()),
    );
    if (corrupted.length) {
      const existing = problems.find((p) => p.locale === code);
      const msg = `${corrupted.length} corrupted string(s) — run node scripts/i18n-repair-corruption.mjs`;
      if (existing) existing.corrupted = msg;
      else problems.push({ locale: code, missing: [], extra: [], corrupted: msg });
    }
  }

  const errors = problems.reduce(
    (n, p) => n + p.missing.length + p.extra.length + (p.corrupted ? 1 : 0),
    0,
  );

  if (JSON_OUT) {
    console.log(JSON.stringify({ errors, locales: problems.length, problems }));
    process.exit(errors > 0 ? 1 : 0);
  }

  console.log("i18n locale key parity (vs src/i18n/messages/en.js)\n");
  if (errors === 0) {
    console.log(`  PASS — ${files.length} locale file(s), ${sourceKeys.length} keys each\n`);
    process.exit(0);
  }

  console.log(`  FAIL — ${errors} key mismatch(es) in ${problems.length} locale(s)\n`);
  for (const p of problems) {
    if (p.missing.length) {
      console.log(`  ${p.locale}: missing ${p.missing.length} key(s)`);
      for (const k of p.missing.slice(0, 8)) console.log(`    - ${k}`);
      if (p.missing.length > 8) console.log(`    … and ${p.missing.length - 8} more`);
    }
    if (p.extra.length) {
      console.log(`  ${p.locale}: ${p.extra.length} unknown key(s)`);
      for (const k of p.extra.slice(0, 5)) console.log(`    + ${k}`);
    }
    if (p.corrupted) {
      console.log(`  ${p.locale}: ${p.corrupted}`);
    }
  }
  console.log("\n  Run: node scripts/sync-i18n-keys.mjs");
  console.log("  Corruption: node scripts/i18n-repair-corruption.mjs\n");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

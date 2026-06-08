#!/usr/bin/env node
/**
 * Fill locale files with machine translations where values still match English.
 * Uses MyMemory free API (rate-limited). Run: node scripts/i18n-auto-translate.mjs [locale]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src/i18n/messages");

/** @type {Record<string, string>} MyMemory target lang codes */
const LANG = {
  as: "as-IN",
  bn: "bn-IN",
  brx: "hi-IN",
  doi: "hi-IN",
  gu: "gu-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  ks: "ur-PK",
  kok: "hi-IN",
  mai: "hi-IN",
  ml: "ml-IN",
  mni: "bn-IN",
  mr: "mr-IN",
  ne: "ne-NP",
  or: "or-IN",
  pa: "pa-IN",
  sa: "hi-IN",
  sat: "hi-IN",
  sd: "sd-PK",
  ta: "ta-IN",
  te: "te-IN",
  ur: "ur-PK",
};

const SKIP_KEYS = new Set(["brand.tadsayaNote"]);

/** @param {string} source @param {string | null} translated */
function acceptTranslation(source, translated) {
  if (!translated || translated === source) return false;
  const sourceHasPlaceholder = /\{\w+\}/.test(source);
  if (!sourceHasPlaceholder && /\{0\}|\{1\}/.test(translated)) return false;
  return true;
}
const PROPER_WORDS = [
  "Daloy Tech",
  "Tadsaya",
  "Pro",
  "Power",
  "Free",
  "iPhone",
  "iPad",
  "Android",
  "Chrome",
  "Safari",
  "Supabase",
  "JSON",
  "PAN",
  "EMI",
  "CTC",
  "PF",
  "SMS",
  "WhatsApp",
];

/** @param {string} text */
function protect(text) {
  const tokens = [];
  let out = text.replace(/\{(\w+)\}/g, (_, name) => {
    const tok = `__CT${tokens.length}__`;
    tokens.push(`{${name}}`);
    return tok;
  });
  for (const word of PROPER_WORDS) {
    while (out.includes(word)) {
      const tok = `__CT${tokens.length}__`;
      tokens.push(word);
      out = out.replace(word, tok);
    }
  }
  return { out, tokens };
}

/** @param {string} text @param {string[]} tokens */
function restore(text, tokens) {
  let out = text;
  tokens.forEach((tok, i) => {
    out = out.split(`__CT${i}__`).join(tok);
  });
  return out;
}

/** @param {string} text @param {string} target */
async function translateText(text, target) {
  if (!text.trim()) return text;
  const { out, tokens } = protect(text);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(out.slice(0, 480))}&langpair=en|${target}`;
  const res = await fetch(url);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated || data.responseStatus === 429) return null;
  return restore(translated, tokens);
}

/** @param {Record<string, string>} messages */
function serialize(messages) {
  const lines = ["export default {"];
  for (const [key, value] of Object.entries(messages)) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(String(value))},`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadModule(file) {
  const mod = await import(pathToFileURL(file).href + "?v=" + Date.now());
  return mod.default || mod;
}

async function translateLocale(code) {
  const en = await loadModule(path.join(MESSAGES_DIR, "en.js"));
  const filePath = path.join(MESSAGES_DIR, `${code}.js`);
  const messages = await loadModule(filePath);
  const target = LANG[code];
  if (!target) {
    console.log(`Skip ${code}: no lang mapping`);
    return;
  }

  let updated = 0;
  const keys = Object.keys(en);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const enVal = en[key];
    if (!(key in messages)) messages[key] = enVal;
    if (messages[key] !== enVal) continue;
    if (SKIP_KEYS.has(key)) continue;

    const translated = await translateText(enVal, target);
    if (acceptTranslation(enVal, translated)) {
      messages[key] = translated;
      updated += 1;
      process.stdout.write(`\r  ${code}: ${i + 1}/${keys.length} (${updated} translated)`);
    }
    await sleep(350);
  }
  fs.writeFileSync(filePath, serialize(messages), "utf8");
  console.log(`\n  ${code}.js — ${updated} strings translated`);
}

async function main() {
  const only = process.argv[2];
  const codes = only ? [only] : Object.keys(LANG);
  for (const code of codes) {
    console.log(`Translating ${code}…`);
    await translateLocale(code);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

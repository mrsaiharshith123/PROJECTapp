#!/usr/bin/env node
/**
 * Fill locale files with machine translations where values still match English.
 * Uses Anthropic Claude API with financial glossary context.
 * Run with ANTHROPIC_API_KEY set:
 *   ANTHROPIC_API_KEY=your_key node scripts/i18n-auto-translate.mjs [locale]
 * Claude Haiku costs ~$0.001 per 1000 keys — all 22 languages once ≈ $0.50–2.00.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import "./loadDotEnv.mjs";
import { DO_NOT_TRANSLATE, FINANCIAL_CONTEXT } from "../src/i18n/financialGlossary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src/i18n/messages");
const DELAY_MS = 100;

/** @type {Record<string, string>} */
const LANG = {
  as: "Assamese",
  bn: "Bengali",
  brx: "Bodo",
  doi: "Dogri",
  gu: "Gujarati",
  hi: "Hindi",
  kn: "Kannada",
  ks: "Kashmiri",
  kok: "Konkani",
  mai: "Maithili",
  ml: "Malayalam",
  mni: "Manipuri",
  mr: "Marathi",
  ne: "Nepali",
  or: "Odia",
  pa: "Punjabi",
  sa: "Sanskrit",
  sat: "Santali",
  sd: "Sindhi",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
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
  "Tadsaya",
  "Perovo",
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
  "SIP",
  "CTC",
  "PF",
  "SMS",
  "WhatsApp",
];

/** @param {string} text */
function protect(text) {
  const tokens = [];
  let out = text.replace(/\{(\w+)\}/g, (_, name) => {
    const tok = `__PV${tokens.length}__`;
    tokens.push(`{${name}}`);
    return tok;
  });
  for (const word of PROPER_WORDS) {
    while (out.includes(word)) {
      const tok = `__PV${tokens.length}__`;
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
    out = out.split(`__PV${i}__`).join(tok);
  });
  return out;
}

/** @param {string} text @param {string} targetLang @param {string} [key] */
async function translateText(text, targetLang, key = "") {
  if (DO_NOT_TRANSLATE.has(text.trim())) return text;
  if (/^[\d₹%.,\s]+$/.test(text)) return text;
  if (/^\{[^}]+\}$/.test(text)) return text;

  const relevantContext = Object.entries(FINANCIAL_CONTEXT)
    .filter(([term]) => text.toLowerCase().includes(term.toLowerCase()))
    .map(([term, ctx]) => `"${term}" means: ${ctx}`)
    .join("\n");

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.warn("No ANTHROPIC_API_KEY — skipping:", text.slice(0, 40));
    return text;
  }

  const { out, tokens } = protect(text);

  const systemPrompt = `You are a professional financial translator specializing in Indian personal finance apps.
Translate the given UI string from English to ${targetLang}.

CRITICAL RULES:
1. This is a FINANCIAL APP for salaried Indians. Every word must be in FINANCIAL context.
2. These terms must NEVER be translated, keep them exactly as-is: ${[...DO_NOT_TRANSLATE].join(", ")}
3. Brand name "Perovo" must stay as "Perovo".
4. Keep all placeholders like {name}, {amount}, {count} exactly as-is (they appear as __PVn__ tokens — restore them).
5. For short labels (1-3 words), give the most natural financial translation.
6. Return ONLY the translated text. No explanations, no quotes, no extra content.

${relevantContext ? `SPECIFIC CONTEXT FOR THIS STRING:\n${relevantContext}` : ""}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: out }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    if (!translateText._errLogged) {
      translateText._errLogged = true;
      const msg = data?.error?.message || `HTTP ${res.status}`;
      console.error(`\nAnthropic API error: ${msg}`);
      if (String(msg).toLowerCase().includes("credit")) {
        console.error("Add credits at https://console.anthropic.com/settings/billing then re-run.\n");
      }
    }
    return text;
  }
  const translated = data?.content?.[0]?.text?.trim();
  if (!translated) return text;
  if (translated.length < 1) return text;
  if (translated.length > text.length * 5) return text;

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

    const translated = await translateText(enVal, target, key);
    if (acceptTranslation(enVal, translated)) {
      messages[key] = translated;
      updated += 1;
      process.stdout.write(`\r  ${code}: ${i + 1}/${keys.length} (${updated} translated)`);
    }
    await sleep(DELAY_MS);
  }
  fs.writeFileSync(filePath, serialize(messages), "utf8");
  console.log(`\n  ${code}.js — ${updated} strings translated`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Missing ANTHROPIC_API_KEY. Add it to .env in the project root, then re-run.\n" +
        "  Example: ANTHROPIC_API_KEY=sk-ant-... npm run i18n:translate"
    );
    process.exit(1);
  }

  // Fail fast if billing/key is invalid (one cheap probe call).
  const probe = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8,
      messages: [{ role: "user", content: "ok" }],
    }),
  });
  const probeData = await probe.json();
  if (!probe.ok) {
    const msg = probeData?.error?.message || `HTTP ${probe.status}`;
    console.error(`Anthropic API rejected the key: ${msg}`);
    if (String(msg).toLowerCase().includes("credit")) {
      console.error("Add credits at https://console.anthropic.com/settings/billing");
    }
    process.exit(1);
  }

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

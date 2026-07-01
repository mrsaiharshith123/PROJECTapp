#!/usr/bin/env node
// ═══════════════════════════════════════════════════
// KEEP ON ANTHROPIC CLAUDE — DO NOT MIGRATE TO GEMINI
// This script translates financial terminology into 22
// Indian languages including minority languages (Maithili,
// Santali, Manipuri, Konkani, Kashmiri). Claude Haiku
// produces significantly better quality for these low-resource
// languages. Cost: ~₹50-150 total per full run (dev only).
// ═══════════════════════════════════════════════════
/**
 * Fix known literal financial mistranslations using Claude API.
 * Loads ANTHROPIC_API_KEY from project .env via scripts/loadDotEnv.mjs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import "./loadDotEnv.mjs";
import { DO_NOT_TRANSLATE } from "../src/i18n/financialGlossary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src/i18n/messages");
const DELAY_MS = 100;

const LANG_NAMES = {
  hi: "Hindi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  or: "Odia",
  as: "Assamese",
  ur: "Urdu",
};

const WRONG_PATTERNS = [
  { pattern: /बायां/g, lang: "hi", hint: '"remaining" must mean money left (शेष), not direction (बायां)' },
  { pattern: /बाएं/g, lang: "hi", hint: '"remaining/left" must mean money left (शेष), not direction' },
];

/** Known bad values → correct without API (financial context). */
const STATIC_FIXES = {
  hi: {
    "home.left": "शेष",
  },
};

let apiErrorLogged = false;

/** @param {Response} res @param {Record<string, unknown>} data */
function logApiError(res, data) {
  if (apiErrorLogged) return;
  apiErrorLogged = true;
  const err = /** @type {{ message?: string; type?: string }} */ (data?.error);
  const msg = err?.message || err?.type || `HTTP ${res.status}`;
  console.error(`\nAnthropic API error: ${msg}`);
  if (String(msg).toLowerCase().includes("credit")) {
    console.error("Add credits at https://console.anthropic.com/settings/billing then re-run.\n");
  }
}

async function loadModule(file) {
  const mod = await import(pathToFileURL(file).href + "?v=" + Date.now());
  return mod.default || mod;
}

function serialize(messages) {
  const lines = ["export default {"];
  for (const [key, value] of Object.entries(messages)) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(String(value))},`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** @param {string} text @param {string} langName @param {string} hint */
async function retranslate(text, langName, hint) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return null;

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
      system: `You are a professional financial translator for Indian personal finance apps.
Fix this ${langName} UI string. ${hint}
Keep placeholders like {name}, {amount} unchanged.
Terms never translated: ${[...DO_NOT_TRANSLATE].join(", ")}
Return ONLY the corrected translation.`,
      messages: [{ role: "user", content: text }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    logApiError(res, data);
    return null;
  }
  return data?.content?.[0]?.text?.trim() || null;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY — add it to .env in the project root.");
    process.exit(1);
  }

  const only = process.argv[2];
  const files = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".js") && f !== "en.js" && (!only || f === `${only}.js`));

  let fixed = 0;
  for (const file of files) {
    const code = file.replace(".js", "");
    const langName = LANG_NAMES[code] || code;
    const filePath = path.join(MESSAGES_DIR, file);
    const messages = await loadModule(filePath);
    let changed = false;

    const staticForLocale = STATIC_FIXES[code] || {};
    for (const [key, replacement] of Object.entries(staticForLocale)) {
      if (messages[key] && messages[key] !== replacement) {
        console.log(`  ${code} ${key}: static fix → ${replacement}`);
        messages[key] = replacement;
        changed = true;
        fixed += 1;
      }
    }

    for (const [key, value] of Object.entries(messages)) {
      for (const { pattern, lang, hint } of WRONG_PATTERNS) {
        if (lang !== code) continue;
        if (!pattern.test(value)) continue;
        pattern.lastIndex = 0;
        if (staticForLocale[key]) continue;
        console.log(`  ${code} ${key}: ${value.slice(0, 60)}…`);
        const next = await retranslate(value, langName, hint);
        if (next && next !== value) {
          messages[key] = next;
          changed = true;
          fixed += 1;
        }
        await sleep(DELAY_MS);
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, serialize(messages), "utf8");
      console.log(`  Wrote ${file}`);
    }
  }
  console.log(`Done — ${fixed} value(s) fixed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

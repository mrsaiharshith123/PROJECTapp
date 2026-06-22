#!/usr/bin/env node
/**
 * No-cost i18n fixer: static glossary + optional MyMemory for still-English keys.
 * Zero paid APIs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { DO_NOT_TRANSLATE } from "../src/i18n/financialGlossary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src", "i18n", "messages");

const STATIC_FIXES = {
  hi: {
    "pressure.elevated": "बढ़ा हुआ",
    "pressure.constrained": "सीमित",
    "pressure.safe": "सुरक्षित",
    "pressure.moderate": "मध्यम",
    "pressure.critical": "गंभीर",
    "home.left": "शेष",
    "common.remaining": "बाकी",
  },
  te: {
    "pressure.elevated": "పెరిగిన",
    "pressure.constrained": "పరిమితం",
    "pressure.safe": "సురక్షితం",
    "pressure.critical": "విపత్కరం",
    "home.left": "మిగిలిన",
    "common.remaining": "మిగిలిన",
  },
  ta: {
    "pressure.elevated": "உயர்ந்த",
    "pressure.constrained": "கட்டுப்படுத்தப்பட்ட",
    "pressure.safe": "பாதுகாப்பான",
    "pressure.critical": "முக்கியமான",
    "home.left": "மீதி",
    "common.remaining": "மீதி",
  },
  kn: {
    "pressure.elevated": "ಏರಿದ",
    "pressure.constrained": "ಸೀಮಿತ",
    "pressure.safe": "ಸುರಕ್ಷಿತ",
    "pressure.critical": "ನಿರ್ಣಾಯಕ",
    "home.left": "ಉಳಿದ",
  },
  bn: {
    "pressure.elevated": "বর্ধিত",
    "pressure.constrained": "সীমিত",
    "pressure.safe": "নিরাপদ",
    "pressure.critical": "গুরুতর",
    "home.left": "বাকি",
  },
  ml: {
    "pressure.elevated": "ഉയർന്ന",
    "pressure.constrained": "പരിമിതം",
    "pressure.safe": "സുരക്ഷിതം",
    "pressure.critical": "ഗുരുതരം",
    "home.left": "ശേഷിക്കുന്ന",
  },
  mr: {
    "pressure.elevated": "वाढलेला",
    "pressure.constrained": "मर्यादित",
    "pressure.safe": "सुरक्षित",
    "pressure.critical": "गंभीर",
    "home.left": "शिल्लक",
  },
  gu: {
    "pressure.elevated": "વધેલ",
    "pressure.constrained": "મર્યાદિત",
    "pressure.safe": "સુરક્ષિત",
    "pressure.critical": "ગંભીર",
    "home.left": "બાકી",
  },
  pa: {
    "pressure.elevated": "ਵਧਿਆ",
    "pressure.constrained": "ਸੀਮਿਤ",
    "pressure.safe": "ਸੁਰੱਖਿਅਤ",
    "pressure.critical": "ਗੰਭੀਰ",
    "home.left": "ਬਾਕੀ",
  },
  ur: {
    "pressure.elevated": "بلند",
    "pressure.constrained": "محدود",
    "pressure.safe": "محفوظ",
    "pressure.critical": "شدید",
    "home.left": "باقی",
  },
};

const MYMEMORY_LANG_CODES = {
  hi: "hi",
  bn: "bn",
  te: "te",
  ta: "ta",
  kn: "kn",
  ml: "ml",
  mr: "mr",
  gu: "gu",
  pa: "pa",
  ur: "ur",
  or: "or",
  as: "as",
  ne: "ne",
  sa: "sa",
};

const SKIP_LANGS = new Set(["brx", "doi", "kok", "ks", "mai", "mni", "sat", "sd", "en"]);

const SKIP_TERMS = [
  "EMI",
  "SIP",
  "CIBIL",
  "UPI",
  "PAN",
  "GST",
  "NEFT",
  "RTGS",
  "PPF",
  "EPF",
  "NPS",
  "ELSS",
  "HRA",
  "ITR",
  "TDS",
  "IMPS",
  "NACH",
  "ECS",
  "FD",
  "RD",
  "LIC",
  "BBPS",
  "Perovo",
  "Pro",
  "Power",
  "Haiku",
  "WhatsApp",
];

/** Common Devanagari transliterations of acronyms → restore English */
const TRANSLITERATION_FIXES = [
  { pattern: /ईएमआई/g, term: "EMI" },
  { pattern: /एसआईपी/g, term: "SIP" },
  { pattern: /यूपीआई/g, term: "UPI" },
  { pattern: /पीपीएफ/g, term: "PPF" },
  { pattern: /ईपीएफ/g, term: "EPF" },
  { pattern: /एनपीएस/g, term: "NPS" },
  { pattern: /ईएलएसएस/g, term: "ELSS" },
  { pattern: /जीएसटी/g, term: "GST" },
  { pattern: /पैन/g, term: "PAN" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

/** @param {string} text @param {string} targetLang */
async function translateFree(text, targetLang) {
  if (!text?.trim()) return text;
  for (const term of SKIP_TERMS) {
    if (text === term) return text;
  }
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
  const res = await fetch(url);
  const data = await res.json();
  await sleep(300);
  return data?.responseData?.translatedText ?? text;
}

function enforceDoNotTranslate(value) {
  let next = value;
  for (const term of DO_NOT_TRANSLATE) {
    if (next.includes(term)) continue;
    for (const { pattern, term: english } of TRANSLITERATION_FIXES) {
      if (english !== term) continue;
      if (pattern.test(next)) {
        pattern.lastIndex = 0;
        next = next.replace(pattern, term);
      }
    }
  }
  const brandTerms = ["Perovo", "Pro", "Power"];
  for (const term of [...brandTerms, ...DO_NOT_TRANSLATE]) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![A-Za-zÀ-ÿ])${escaped}(?![A-Za-zÀ-ÿ])`, "gi");
    next = next.replace(re, term);
  }
  return next;
}

async function main() {
  const only = process.argv[2];
  const useApi = process.argv.includes("--api");
  const enPath = path.join(MESSAGES_DIR, "en.js");
  const english = await loadModule(enPath);

  const files = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".js") && f !== "en.js" && (!only || f === `${only}.js`));

  let staticFixed = 0;
  let apiFixed = 0;
  let acronymFixed = 0;

  for (const file of files) {
    const code = file.replace(".js", "");
    if (SKIP_LANGS.has(code)) continue;

    const filePath = path.join(MESSAGES_DIR, file);
    const messages = await loadModule(filePath);
    let changed = false;

    const staticForLocale = STATIC_FIXES[code] || {};
    for (const [key, replacement] of Object.entries(staticForLocale)) {
      if (messages[key] && messages[key] !== replacement) {
        messages[key] = replacement;
        changed = true;
        staticFixed += 1;
      }
    }

    if (useApi && MYMEMORY_LANG_CODES[code]) {
      const target = MYMEMORY_LANG_CODES[code];
      for (const [key, value] of Object.entries(messages)) {
        const enVal = english[key];
        if (!enVal || value !== enVal) continue;
        if (staticForLocale[key]) continue;
        if (/^[\d₹%→·\s—–-]+$/.test(enVal)) continue;
        const translated = await translateFree(enVal, target);
        if (translated && translated !== value && translated !== enVal) {
          messages[key] = translated;
          changed = true;
          apiFixed += 1;
        }
      }
    }

    for (const [key, value] of Object.entries(messages)) {
      const fixed = enforceDoNotTranslate(value);
      if (fixed !== value) {
        messages[key] = fixed;
        changed = true;
        acronymFixed += 1;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, serialize(messages), "utf8");
      console.log(`Wrote ${file} (static: ${Object.keys(staticForLocale).length} keys in glossary)`);
    }
  }

  console.log(
    `Done — static: ${staticFixed}, API: ${apiFixed}${useApi ? "" : " (skipped — pass --api to enable MyMemory)"}, acronym: ${acronymFixed}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

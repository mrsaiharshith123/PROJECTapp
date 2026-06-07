#!/usr/bin/env node
import fs from "fs";
import path from "path";
import vm from "vm";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src", "i18n", "messages");

const LOCALES = [
  "as",
  "bn",
  "brx",
  "doi",
  "gu",
  "hi",
  "kn",
  "ks",
  "kok",
  "mai",
  "ml",
  "mni",
  "mr",
  "ne",
  "or",
  "pa",
  "sa",
  "sat",
  "sd",
  "ta",
  "te",
  "ur",
];

const TARGET_CODES = {
  as: "as",
  bn: "bn",
  brx: "bho",
  doi: "doi",
  gu: "gu",
  hi: "hi",
  kn: "kn",
  ks: "ur",
  kok: "kok",
  mai: "mai",
  ml: "ml",
  mni: "mni-Mtei",
  mr: "mr",
  ne: "ne",
  or: "or",
  pa: "pa",
  sa: "sa",
  sat: "sat",
  sd: "sd",
  ta: "ta",
  te: "te",
  ur: "ur",
};

const PROPER_NOUNS = [
  "CommitTrack",
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

const SKIP_TRANSLATE_KEYS = new Set(["brand.appName"]);

function isCorruptedTranslation(text) {
  return /tokens\.push|__T\d+__|^\(\)\s*=>/m.test(String(text));
}

function loadLocale(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  source = source.replace(/^\uFEFF/, "").replace(/export\s+default/, "module.exports =");
  const context = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(source, context, { filename: filePath });
  return context.module.exports;
}

function escapeValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function serializeLocale(messages, orderedKeys) {
  const lines = ["export default {"];
  for (const key of orderedKeys) {
    const value = messages[key] ?? "";
    lines.push(`  "${key}": "${escapeValue(value)}",`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

function protectText(text) {
  const tokens = [];
  let masked = text;

  const maskRegex = (regex) => {
    masked = masked.replace(regex, (match) => {
      const idx = tokens.push(match) - 1;
      return `__T${idx}__`;
    });
  };

  maskRegex(/\{[^}]+\}/g);
  maskRegex(/₹[\d,]+(?:\.\d+)?/g);

  const sortedNouns = [...PROPER_NOUNS].sort((a, b) => b.length - a.length);
  for (const noun of sortedNouns) {
    if (!masked.includes(noun)) continue;
    const escaped = noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    masked = masked.replace(new RegExp(escaped, "g"), () => {
      const idx = tokens.push(noun) - 1;
      return `__T${idx}__`;
    });
  }

  return { masked, tokens };
}

function unprotectText(text, tokens) {
  let result = text;
  for (let i = 0; i < tokens.length; i += 1) {
    result = result.split(`__T${i}__`).join(tokens[i]);
  }
  return result;
}

const cache = new Map();

function translateWithGoogle(text, targetCode, attempt = 0) {
  const cacheKey = `${targetCode}||${text}`;
  if (cache.has(cacheKey)) {
    return Promise.resolve(cache.get(cacheKey));
  }

  return new Promise((resolve) => {
    const url =
      "https://translate.googleapis.com/translate_a/single" +
      `?client=gtx&sl=en&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(text)}`;

    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            if (attempt < 2) {
              setTimeout(
                () => resolve(translateWithGoogle(text, targetCode, attempt + 1)),
                300 * (attempt + 1),
              );
              return;
            }
            cache.set(cacheKey, text);
            resolve(text);
            return;
          }

          try {
            const parsed = JSON.parse(body);
            const translated = (parsed?.[0] ?? []).map((part) => part?.[0] ?? "").join("") || text;
            cache.set(cacheKey, translated);
            resolve(translated);
          } catch {
            cache.set(cacheKey, text);
            resolve(text);
          }
        });
      })
      .on("error", () => {
        if (attempt < 2) {
          setTimeout(
            () => resolve(translateWithGoogle(text, targetCode, attempt + 1)),
            300 * (attempt + 1),
          );
          return;
        }
        cache.set(cacheKey, text);
        resolve(text);
      });
  });
}

async function main() {
  const enPath = path.join(MESSAGES_DIR, "en.js");
  const enMessages = loadLocale(enPath);
  const keys = Object.keys(enMessages);
  console.log(`EN keys: ${keys.length}`);

  for (const locale of LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.js`);
    const current = loadLocale(filePath);
    const next = { ...current };
    let translatedCount = 0;

    for (const key of keys) {
      const enValue = String(enMessages[key] ?? "");
      const currentValue = String(current[key] ?? "");

      if (!(key in next)) {
        next[key] = enValue;
      }

      if (currentValue === enValue) {
        if (SKIP_TRANSLATE_KEYS.has(key)) {
          next[key] = enValue;
          continue;
        }
        const { masked, tokens } = protectText(enValue);
        const rawTranslated = await translateWithGoogle(masked, TARGET_CODES[locale]);
        const translated = unprotectText(rawTranslated, tokens);
        if (isCorruptedTranslation(translated)) {
          next[key] = enValue;
          continue;
        }
        next[key] = translated;
        translatedCount += 1;
      }
    }

    fs.writeFileSync(filePath, serializeLocale(next, keys), "utf8");
    console.log(`${locale}: translated ${translatedCount}`);
  }

  console.log(`Updated locales: ${LOCALES.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

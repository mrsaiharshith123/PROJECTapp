#!/usr/bin/env node
/**
 * Fast parallel locale fill — only keys still identical to English.
 * Persistent cache: scripts/.i18n-translate-cache.json
 *   npm run i18n:translate:all
 *   node scripts/translate-fallback-locales.mjs te
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "src", "i18n", "messages");
const CACHE_PATH = path.join(__dirname, ".i18n-translate-cache.json");
const CONCURRENCY = Number(process.env.I18N_CONCURRENCY || 30);

const LOCALES = [
  "as", "bn", "brx", "doi", "gu", "hi", "kn", "ks", "kok", "mai", "ml", "mni",
  "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur",
];

const TARGET_CODES = {
  as: "as", bn: "bn", brx: "bho", doi: "doi", gu: "gu", hi: "hi", kn: "kn",
  ks: "ks", kok: "kok", mai: "mai", ml: "ml", mni: "mni-Mtei", mr: "mr",
  ne: "ne", or: "or", pa: "pa", sa: "sa", sat: "sat", sd: "sd", ta: "ta",
  te: "te", ur: "ur",
};

const PROPER_NOUNS = [
  "Daloy Tech", "Tadsaya", "Pro", "Power", "Free", "iPhone", "iPad", "Android",
  "Chrome", "Safari", "Supabase", "JSON", "PAN", "EMI", "CTC", "PF", "SMS", "WhatsApp",
];

/** Email address and PAN format sample — stay Latin by design. */
const ALLOW_IDENTICAL = new Set(["support.contactEmail", "account.panPlaceholder"]);

/** ASCII strings with common English words — stale copy not matching en.js. */
const ENGLISH_WORD_RE =
  /\b(the|and|for|your|this|with|from|are|has|have|will|month|bill|paid|due|edit|delete|add|select|setup|before|name|mobile|salary|payment|loan|insight|pressure|score|free|cash|help|guide|privacy|contact|current|plan|feature|pro|power|pick|topic|switch|graph|type|tap|orange|variable|bars|slice|spent|open|stress|swipe|between|views|chart|change|record|log|spend|see|where|same|data|phone|icon|paste|debit)\b/i;

function needsTranslation(key, currentValue, enValue) {
  if (ALLOW_IDENTICAL.has(key)) return false;
  const cur = String(currentValue ?? "");
  const enV = String(enValue ?? "");
  if (key === "brand.proSuffix" && (cur === "Pro" || cur === enV)) return true;
  if (cur === enV) return true;
  if (cur.length < 4) return false;
  // Old English left in locale files after en.js changed — re-translate from current en.
  if (/^[\x00-\x7F]+$/.test(cur) && ENGLISH_WORD_RE.test(cur)) return true;
  return false;
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 0), "utf8");
}

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
    lines.push(`  "${key}": "${escapeValue(messages[key] ?? "")}",`);
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
  for (const noun of [...PROPER_NOUNS].sort((a, b) => b.length - a.length)) {
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

/** Google has no en→ks; adapt Urdu output toward Kashmiri (Perso-Arabic). */
const KS_FROM_UR = [
  [/گھر/g, "کُھر"],
  [/شامل کریں۔/g, "شٲمِل کٔرِو۔"],
  [/شامل کریں/g, "شٲمِل کٔرِو"],
  [/قرضہ دینا/g, "قرض دینٲ"],
  [/محفوظ/g, "رٲکھو"],
  [/منسوخ/g, "خٲرِج"],
  [/جاری رکھیں/g, "جٲری تھٲوِو"],
  [/میں/g, "مَنٛز"],
  [/ہیں/g, "چھُ"],
  [/ہے/g, "چھُ"],
  [/کا/g, "کٕ"],
  [/کی/g, "کٕ"],
  [/کے/g, "کٕ"],
  [/آپ/g, "تُہۍ"],
  [/میرا/g, "مِیُن"],
  [/میرے/g, "مِیُن"],
];

function adaptKashmiriFromUrdu(text) {
  let out = String(text);
  for (const [pattern, replacement] of KS_FROM_UR) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

const memCache = loadCache();

function translateWithGoogle(text, targetCode, attempt = 0) {
  const cacheKey = `${targetCode}||${text}`;
  if (memCache[cacheKey]) return Promise.resolve(memCache[cacheKey]);

  return new Promise((resolve) => {
    const url =
      "https://translate.googleapis.com/translate_a/single" +
      `?client=gtx&sl=en&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(text)}`;

    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            if (attempt < 2) {
              setTimeout(() => resolve(translateWithGoogle(text, targetCode, attempt + 1)), 200 * (attempt + 1));
              return;
            }
            memCache[cacheKey] = text;
            resolve(text);
            return;
          }
          try {
            const parsed = JSON.parse(body);
            const translated = (parsed?.[0] ?? []).map((p) => p?.[0] ?? "").join("") || text;
            memCache[cacheKey] = translated;
            resolve(translated);
          } catch {
            memCache[cacheKey] = text;
            resolve(text);
          }
        });
      })
      .on("error", () => {
        if (attempt < 2) {
          setTimeout(() => resolve(translateWithGoogle(text, targetCode, attempt + 1)), 200 * (attempt + 1));
          return;
        }
        memCache[cacheKey] = text;
        resolve(text);
      });
  });
}

async function mapPool(items, fn, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function translateLocale(locale, enMessages, keys, { rebuild = false } = {}) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.js`);
  const current = loadLocale(filePath);
  const next = { ...current };
  const target = TARGET_CODES[locale];

  if (rebuild) {
    for (const key of keys) {
      if (!ALLOW_IDENTICAL.has(key)) next[key] = enMessages[key];
    }
  }

  const todo = keys.filter((key) =>
    needsTranslation(key, next[key], enMessages[key]),
  );

  if (!todo.length) {
    console.log(`${locale}: 0 to translate`);
    return;
  }

  const translated = await mapPool(
    todo,
    async (key) => {
      const enValue = String(enMessages[key] ?? "");
      const { masked, tokens } = protectText(enValue);
      const apiTarget = locale === "ks" ? "ur" : target;
      let raw = await translateWithGoogle(masked.slice(0, 480), apiTarget);
      if (locale === "ks") raw = adaptKashmiriFromUrdu(raw);
      let value = unprotectText(raw, tokens);
      if (key === "brand.appName" && /^CommitTrack$/i.test(value)) {
        let brand = await translateWithGoogle("Commit Track", apiTarget);
        if (locale === "ks") brand = adaptKashmiriFromUrdu(brand);
        if (brand && !/^CommitTrack$/i.test(brand)) value = brand;
      }
      const fallback = locale === "ks" ? adaptKashmiriFromUrdu(unprotectText(raw, tokens)) : enValue;
      return { key, value: isCorruptedTranslation(value) ? fallback : value };
    },
    CONCURRENCY,
  );

  for (const { key, value } of translated) {
    next[key] = value;
  }

  fs.writeFileSync(filePath, serializeLocale(next, keys), "utf8");
  saveCache(memCache);
  console.log(`${locale}: translated ${translated.length}`);
}

async function main() {
  const only = process.argv.find((a) => a && !a.startsWith("-") && LOCALES.includes(a));
  const rebuild = process.argv.includes("--rebuild");
  const locales = only ? [only] : LOCALES;
  const enMessages = loadLocale(path.join(MESSAGES_DIR, "en.js"));
  const keys = Object.keys(enMessages);
  console.log(`EN keys: ${keys.length} · concurrency ${CONCURRENCY}${rebuild ? " · rebuild" : ""}`);

  for (const locale of locales) {
    await translateLocale(locale, enMessages, keys, { rebuild: rebuild && Boolean(only) });
  }

  saveCache(memCache);
  console.log(`Done — ${locales.length} locale(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

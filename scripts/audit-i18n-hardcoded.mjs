#!/usr/bin/env node
/**
 * Find user-facing English NOT going through i18n.
 *   npm run audit:i18n:hardcoded
 *   node scripts/audit-i18n-hardcoded.mjs --strict
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const UI_DIR = path.join(ROOT, "src/ui");
const MESSAGES_DIR = path.join(ROOT, "src/i18n/messages");

const STRICT = process.argv.includes("--strict");
const LIST = process.argv.includes("--list");

const SKIP_DIRS = new Set(["__tests__", "tokens", "utils"]);
const SKIP_FILE_RE = /\.(test|spec)\./;

/** JSX / UI patterns that are OK */
const ALLOW_LINE = [
  /^\s*\/\//,
  /^\s*\*/,
  /import\s/,
  /from\s+["']/,
  /className=/,
  /console\./,
  /type:\s*["']/,
  /data-theme/,
  /aria-hidden/,
  /inputMode/,
  /#[0-9a-fA-F]{3,8}/,
  /^\s*i\s*$/,
  /CtIcon/,
  /formatInr|toLocaleString|INR|EM_DASH|ARROW/,
  /t\(/,
  /t\./,
  /translate[A-Z]/,
  /useTranslation/,
  /textKey=/,
  /labelKey=/,
  /hintKey=/,
  /titleKey=/,
  /subtitleKey=/,
  /CALC_HELP\./,
  /help\./,
  /insight\./,
  /microTip\./,
  /pickMicroTip/,
  /useCopy/,
  /COPY\./,
  /getIncomeLabelKey/,
  /getDashboardToolsHeadingKey/,
  /getToolTileKeys/,
  /getAnalyticsCopy/,
  /BILL_STATUS_UI/,
  /role=/,
  /type=/,
  /variant=/,
  /size=/,
  /name=/,
  /id:/,
  /key:/,
  /\.jsx?$/,
  /https?:\/\//,
  /^\s*[\d₹%+\-→·]+/,
];

/** Latin user-facing text in JSX */
const JSX_TEXT_RE = />([^<{][^<{}]{2,}?)<\//g;
const JSX_ATTR_RE =
  /(?:placeholder|title|aria-label|hint|emptyMessage|manualLabel|addLabel|label|eyebrow)=\{?["']([A-Za-z][^"']{3,})["']\}?/g;
const JSX_STRING_CHILD = /["']([A-Z][a-z]+[^"']{4,})["']/g;

const ENGLISH_WORD_RE = /\b(the|and|for|your|this|with|from|are|has|have|will|month|bill|paid|due|edit|delete|add|select|setup|before|name|mobile|salary|payment|loan|insight|pressure|score|free|cash|help|guide|privacy|contact|current|plan|feature|pro|power)\b/i;

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(full, out);
    } else if (/\.(jsx|tsx)$/.test(ent.name) && !SKIP_FILE_RE.test(ent.name)) {
      out.push(full);
    }
  }
  return out;
}

function isAllowedContext(line) {
  return ALLOW_LINE.some((re) => re.test(line));
}

function scanFile(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  /** @type {{ line: number, text: string, kind: string }[]} */
  const hits = [];

  lines.forEach((line, i) => {
    if (isAllowedContext(line)) return;
    if (!/[A-Za-z]{4,}/.test(line)) return;

    let m;
    JSX_TEXT_RE.lastIndex = 0;
    while ((m = JSX_TEXT_RE.exec(line))) {
      const text = m[1].trim();
      if (text.length < 3 || !ENGLISH_WORD_RE.test(text)) continue;
      if (/^\{/.test(text)) continue;
      hits.push({ line: i + 1, text: text.slice(0, 80), kind: "jsx-text" });
    }

    JSX_ATTR_RE.lastIndex = 0;
    while ((m = JSX_ATTR_RE.exec(line))) {
      hits.push({ line: i + 1, text: m[1].slice(0, 80), kind: "attr" });
    }

    if (
      /(?:Caption|Body|Heading|Eyebrow|label|Button|Badge|option)[^>]*>[^<{t][A-Za-z]/.test(line) &&
      ENGLISH_WORD_RE.test(line)
    ) {
      const plain = line.replace(/<[^>]+>/g, " ").trim();
      if (plain.length > 8 && !plain.includes("t(")) {
        hits.push({ line: i + 1, text: plain.slice(0, 80), kind: "component" });
      }
    }
  });

  return hits.length ? { file: rel, hits } : null;
}

function loadLocale(file) {
  let s = fs.readFileSync(file, "utf8").replace(/export\s+default/, "module.exports =");
  const c = { module: { exports: {} } };
  vm.runInNewContext(s, c);
  return c.module.exports;
}

function scanLocaleLatin(locale, en) {
  const messages = loadLocale(path.join(MESSAGES_DIR, `${locale}.js`));
  /** @type {string[]} */
  const latin = [];
  for (const [key, val] of Object.entries(messages)) {
    const s = String(val);
    if (s === en[key]) continue;
    if (s.length < 4) continue;
    if (/^[\x00-\x7F]+$/.test(s) && ENGLISH_WORD_RE.test(s) && !key.startsWith("support.contact")) {
      latin.push(key);
    }
  }
  return latin;
}

const uiFiles = walk(UI_DIR);
const uiIssues = uiFiles.map(scanFile).filter(Boolean);
const uiHitCount = uiIssues.reduce((n, f) => n + f.hits.length, 0);

const en = loadLocale(path.join(MESSAGES_DIR, "en.js"));
const locales = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".js") && f !== "en.js");
/** @type {{ locale: string, latin: number, samples: string[] }[]} */
const localeLatin = locales.map((f) => {
  const code = f.replace(/\.js$/, "");
  const keys = scanLocaleLatin(code, en);
  return { locale: code, latin: keys.length, samples: keys.slice(0, 6) };
});

console.log("i18n hardcoded-string audit\n");
console.log(`  JSX/UI hardcoded English: ${uiHitCount} hit(s) in ${uiIssues.length} file(s)`);
if (LIST) {
  for (const f of uiIssues.slice(0, 25)) {
    console.log(`\n  ${f.file}`);
    for (const h of f.hits.slice(0, 5)) {
      console.log(`    L${h.line} [${h.kind}] ${h.text}`);
    }
    if (f.hits.length > 5) console.log(`    … +${f.hits.length - 5} more`);
  }
  if (uiIssues.length > 25) console.log(`\n  … +${uiIssues.length - 25} more files`);
}

console.log("\n  Locale files with English text (untranslated or stale copy):");
for (const row of localeLatin.sort((a, b) => b.latin - a.latin).slice(0, 8)) {
  if (row.latin === 0) continue;
  console.log(`    ${row.locale}: ${row.latin} key(s)`);
  if (LIST) for (const k of row.samples) console.log(`      - ${k}`);
}

const total = uiHitCount + localeLatin.reduce((s, r) => s + r.latin, 0);
console.log(`\n  Total issues: ${total}`);
console.log("  Fix: wire UI through t() — see .cursor/rules/single-language-i18n.mdc\n");

if (STRICT && uiHitCount > 0) {
  console.log(`  FAIL strict — ${uiHitCount} hardcoded UI string(s)`);
  process.exit(1);
}
process.exit(0);

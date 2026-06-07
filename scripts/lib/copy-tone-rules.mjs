/**
 * User-facing copy tone rules — formal, modest language (not casual / marketing).
 * Used by scripts/audit-copy-tone.mjs and governance guidance audit.
 */
import fs from "fs";
import path from "path";
import { ROOT, SRC, rel, walk } from "./audit-core.mjs";

/** @typedef {{ id: string, pattern: RegExp, message: string, severity?: "error"|"warning" }} CopyToneRule */

/** @type {CopyToneRule[]} */
export const COPY_TONE_RULES = [
  { id: "hey-greeting", pattern: /\bHey[,!\s]/i, message: 'Informal greeting — use "Welcome," or a neutral salutation' },
  { id: "wave-emoji", pattern: /👋/, message: "Avoid emoji in user-facing greetings" },
  { id: "what-if", pattern: /\bwhat[- ]if\b/i, message: 'Use "scenario" or "scenario analysis" instead of "what-if"' },
  { id: "show-me", pattern: /\bShow me\b/i, message: "Use neutral CTAs (e.g. View, Open, See details)" },
  { id: "got-it", pattern: /\bGot it\b/i, message: 'Use "Close" or "Done" instead of "Got it"' },
  { id: "sounds-good", pattern: /\bSounds good\b/i, message: 'Use "Continue" or "Confirm" instead of "Sounds good"' },
  { id: "not-now", pattern: /\bNot now\b/i, message: 'Use "Dismiss" or "Later" instead of "Not now"' },
  { id: "skip-for-now", pattern: /\bSkip for now\b/i, message: 'Use "Skip" or "Skip guide"' },
  { id: "get-started", pattern: /\bGet started\b/i, message: 'Use "Add data" or "Begin setup" instead of "Get started"' },
  { id: "contraction-youre", pattern: /\byou're\b/i, message: 'Avoid contractions in user copy — use "you are"' },
  { id: "contraction-well", pattern: /\bwe'll\b/i, message: 'Avoid contractions — use "we will" or rephrase in third person' },
  { id: "contraction-dont", pattern: /\bdon't\b/i, message: 'Avoid contractions — use "do not"' },
  { id: "contraction-cant", pattern: /\bcan't\b/i, message: 'Avoid contractions — use "cannot"' },
  { id: "contraction-wont", pattern: /\bwon't\b/i, message: 'Avoid contractions — use "will not"' },
  { id: "contraction-doesnt", pattern: /\bdoesn't\b/i, message: 'Avoid contractions — use "does not"' },
  { id: "contraction-youll", pattern: /\byou'll\b/i, message: 'Avoid contractions — use "you will"' },
  { id: "calm-stretch", pattern: /\bcalm stretch\b/i, message: "Use neutral phrasing (e.g. finances appear stable)" },
  { id: "room-to-breathe", pattern: /\bRoom to breathe\b/i, message: "Use formal margin language (e.g. adequate margin remains)" },
  { id: "quick-win", pattern: /\bquick wins?\b/i, message: "Avoid casual idioms — describe outcome plainly" },
  { id: "quick-insight", pattern: /\bQuick insight\b/i, message: 'Use "Insight" or "Summary"' },
  { id: "quick-tips", pattern: /\bQuick tips\b/i, message: 'Use "Guidance" or "Tips"' },
  { id: "glance-at", pattern: /\bglance at\b/i, message: 'Use "review" instead of "glance at"' },
  { id: "jump-to", pattern: /\bjump to\b/i, message: 'Use "navigate to" or "open"' },
  { id: "smarter", pattern: /\bsmarter\b/i, message: "Avoid casual superlatives — state the benefit directly" },
  { id: "all-caught-up", pattern: /\bAll caught up\b/i, message: 'Use "No overdue items" or similar neutral status' },
  { id: "better-money-math", pattern: /\bBetter money math\b/i, message: "Use neutral labels (e.g. Financial calculators)" },
  { id: "tight-vs", pattern: /\btight vs\b/i, message: 'Use "exceeds" or "below available" instead of "tight vs"' },
  { id: "feel-tight", pattern: /\bfeel tight\b/i, message: 'Use "may be limited" instead of "feel tight"' },
  { id: "feel-heavy", pattern: /\bfeel heavy\b/i, message: 'Use "may be substantial" instead of "feel heavy"' },
  { id: "looks-busiest", pattern: /\blooks busiest\b/i, message: 'Use "highest obligations" instead of "looks busiest"' },
  { id: "small-leaks", pattern: /\bsmall leaks\b/i, message: "Describe recurring cost accumulation plainly" },
  { id: "honest-list", pattern: /\bmore honest your\b/i, message: "Use neutral accuracy language (complete and accurate entries)" },
  { id: "exclaim-welcome", pattern: /!\s*Welcome/i, message: "Avoid exclamation marks in subscription or success messages" },
  {
    id: "exclaim-success",
    pattern: /(?:text|message|label|title|body):\s*[`"'][^`"']*![^`"']*[`"']/i,
    severity: "warning",
    message: "Avoid exclamation marks in user-facing strings",
  },
];

const SCAN_ROOTS = [
  path.join(SRC, "ui"),
  path.join(SRC, "constants"),
  path.join(SRC, "guidance"),
  path.join(SRC, "engines"),
  path.join(SRC, "i18n", "messages", "en.js"),
];

const SKIP_FILE_RE =
  /(?:^|\/)(?:__tests__|node_modules|dist|dev-dist)(?:\/|$)|\.test\.(?:js|jsx)$|simulateSubscription|devSubscriptionTools/;

/**
 * @param {string} line
 */
function isLikelyUserCopyLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/copy-tone:ignore/i.test(line)) return false;
  if (/^\s*(import|export)\s/.test(t)) return false;
  if (/^\s*\/\//.test(t)) return false;
  if (/^\s*\*@/.test(t)) return false;
  return /(["'`]|>\s*[A-Za-z0-9₹(]|text:|label:|hint:|title:|message:|body:|subtitle:|placeholder=|Caption|Body|Eyebrow|Button|Modal|ToneSurface)/.test(
    line,
  );
}

/**
 * @param {string} filePath
 * @returns {string[]}
 */
function fileLines(filePath) {
  return fs.readFileSync(filePath, "utf8").split("\n");
}

/**
 * @param {string} filePath
 * @returns {{ file: string, line: number, rule: string, severity: string, message: string, excerpt: string }[]}
 */
export function scanFileForInformalTone(filePath) {
  const file = rel(filePath);
  const hits = [];
  const lines = fileLines(filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isLikelyUserCopyLine(line)) continue;
    for (const rule of COPY_TONE_RULES) {
      if (rule.pattern.test(line)) {
        hits.push({
          file,
          line: i + 1,
          rule: rule.id,
          severity: rule.severity || "error",
          message: rule.message,
          excerpt: line.trim().slice(0, 140),
        });
        break;
      }
    }
  }
  return hits;
}

/**
 * @param {{ roots?: string[], list?: boolean }} [opts]
 */
export function runCopyToneAudit(opts = {}) {
  const roots = opts.roots || SCAN_ROOTS;
  /** @type {{ file: string, line: number, rule: string, severity: string, message: string, excerpt: string }[]} */
  const hits = [];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    if (fs.statSync(root).isFile()) {
      if (!SKIP_FILE_RE.test(root)) hits.push(...scanFileForInformalTone(root));
      continue;
    }
    for (const file of walk(root, [], /\.(jsx?|mjs)$/)) {
      if (SKIP_FILE_RE.test(file)) continue;
      hits.push(...scanFileForInformalTone(file));
    }
  }

  const errors = hits.filter((h) => h.severity === "error");
  const warnings = hits.filter((h) => h.severity === "warning");

  return {
    errors: errors.length,
    warnings: warnings.length,
    errorItems: errors,
    warningItems: warnings,
    hits,
  };
}

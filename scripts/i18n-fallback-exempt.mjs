/**
 * Keys / values allowed to match English in non-en locale files.
 * Shared by audit-i18n-fallback.mjs and translate-fallback-locales.mjs.
 */

/** Explicit key allowlist (symbols, acronyms, brand tiers). */
export const ALLOW_IDENTICAL_KEYS = new Set([
  "brand.proSuffix",
  "plans.pro",
  "plans.power",
  "plans.tier.pro",
  "plans.tier.power",
  "support.contactEmail",
  "account.panPlaceholder",
]);

/** Whole-string acronyms, platform names, and tier labels users expect in Latin. */
const ALLOW_IDENTICAL_VALUES = new Set([
  "Android",
  "iOS",
  "Free",
  "Pro",
  "Power",
  "EPF",
  "PPF",
  "PF / EPF",
  "SIP",
  "FD / RD",
  "HRA",
  "NPS",
  "ARR",
  "MRR",
  "TBD",
  "YoY",
  "CIBIL Sim",
  "Crypto",
  "mo",
  "sq m",
  "₹0",
  "23",
  "4",
  "100%",
  "ABC123",
  "HDFC0001234",
  "perovo.app ✦",
]);

const ENGLISH_WORD_RE =
  /\b(property|freelance|processing|liquidity|projected|buffer|signed|portal|intelligence)\b/i;

/**
 * @param {string} key
 * @param {string} value English reference value (locale value is identical when called from audit).
 */
export function isExemptIdentical(key, value) {
  if (ALLOW_IDENTICAL_KEYS.has(key)) return true;

  const v = String(value ?? "").trim();
  if (!v) return true;
  if (ALLOW_IDENTICAL_VALUES.has(v)) return true;

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return true;
  if (/^[\d%₹.,\s]+$/.test(v)) return true;
  if (/^[A-Z0-9]{4,14}$/.test(v)) return true;

  const stripped = v.replace(/\{[^}]+\}/g, "").trim();
  if (!stripped) return true;

  if (/^[\s₹·/,.\-:()%0-9]+$/i.test(stripped)) return true;

  if (/^(?:[A-Z]{2,}(?:\s*\/\s*[A-Z]{2,})*(?:\s*[·•]\s*[A-Z]{2,}\s*)*)+$/.test(stripped)) {
    return true;
  }

  if (stripped.includes("eSign") || stripped.includes("eStamp") || stripped.includes("Aadhaar")) {
    return true;
  }

  if (/\bmo\b/.test(v) && /\{[^}]+\}/.test(v)) return true;
  if (/\{score\}\/100/.test(v) || /\{karat\}K/.test(v) || /\{grams\} g/.test(v)) return true;
  if (/^\{[^}]+\}\s+of\s+\{[^}]+\}/.test(v)) return true;
  if (/^\{[^}]+\}\s+of\s+\{[^}]+\}\s+\(\{[^}]+\}%\)$/.test(v)) return true;
  if (/^\{[^}]+\}\s+pts\s+(up|down)$/.test(v)) return true;
  if (/^EPF · PPF · NPS · gratuity$/.test(v)) return true;

  if (!ENGLISH_WORD_RE.test(v)) {
    if (/^[\s₹·/,.\-:()%0-9A-Za-z]+$/.test(stripped) && stripped.length <= 24) {
      return !/\b(of|up|down|the|and|for|your)\b/i.test(stripped);
    }
  }

  return false;
}

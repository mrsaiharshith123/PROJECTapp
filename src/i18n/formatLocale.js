/**
 * Locale-aware formatting helpers (uses app language codes from languages.js).
 */

/** @param {string} locale */
function resolveIntlLocale(locale) {
  return locale === "en" ? "en-IN" : locale;
}

/**
 * @param {string} locale
 * @param {string} todayStr — YYYY-MM-DD
 */
/** @param {string} dateStr YYYY-MM-DD @param {string} locale */
export function formatLocaleDate(dateStr, locale) {
  if (!dateStr) return "\u2014";
  const d = new Date(`${dateStr}T12:00:00`);
  const loc = resolveIntlLocale(locale);
  try {
    return new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
  }
}

/** @param {string} locale @param {number} ms */
export function formatAchievementDate(locale, ms) {
  if (!ms) return "";
  const loc = resolveIntlLocale(locale);
  try {
    return new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }).format(new Date(ms));
  } catch {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ms));
  }
}

export function formatMonthYear(locale, todayStr) {
  const d = new Date(`${todayStr}T12:00:00`);
  const loc = resolveIntlLocale(locale);
  try {
    return new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(d);
  }
}

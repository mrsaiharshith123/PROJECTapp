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
export function formatMonthYear(locale, todayStr) {
  const d = new Date(`${todayStr}T12:00:00`);
  const loc = resolveIntlLocale(locale);
  try {
    return new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(d);
  }
}

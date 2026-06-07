/** @typedef {{ key: string, params?: Record<string, string | number> }} AffordWarning */

/** Map affordability tier to i18n keys. */
const AFFORD_TIER_KEYS = {
  safe: "afford.safe",
  moderate_pressure: "afford.moderatePressure",
  high_risk: "afford.highRisk",
  dangerous: "afford.dangerous",
};

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} t
 * @param {{ tier?: string, label?: string } | null | undefined} aff
 */
export function translateAffordabilityLabel(t, aff) {
  if (!aff) return "";
  const key = AFFORD_TIER_KEYS[aff.tier];
  if (key) return t(key);
  return aff.label || "";
}

/**
 * @param {(key: string, params?: Record<string, string | number>) => string} t
 * @param {AffordWarning | string} warning
 */
export function translateAffordWarning(t, warning) {
  if (typeof warning === "string") return warning;
  return t(warning.key, warning.params);
}

/** @param {string} presetKey */
export function presetLabelKey(presetKey) {
  return `preset.${presetKey}`;
}

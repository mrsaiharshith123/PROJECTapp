/** Map engine health levels to i18n keys. */
const HEALTH_LEVEL_KEYS = {
  excellent: "health.excellent",
  good: "health.good",
  caution: "health.caution",
  risky: "health.risky",
};

/** Map pressure score labels (English engine output) to i18n keys. */
const PRESSURE_LABEL_KEYS = {
  Safe: "pressure.safe",
  Moderate: "pressure.moderate",
  Constrained: "pressure.constrained",
  Elevated: "pressure.elevated",
  Critical: "pressure.critical",
};

/**
 * @param {(key: string) => string} t
 * @param {{ level?: string, label?: string } | null | undefined} health
 */
export function translateHealthLabel(t, health) {
  if (!health) return "";
  const key = HEALTH_LEVEL_KEYS[health.level];
  if (key) return t(key);
  return health.label || "";
}

/**
 * @param {(key: string) => string} t
 * @param {string | null | undefined} label
 */
export function translatePressureLabel(t, label) {
  if (!label) return "";
  const key = PRESSURE_LABEL_KEYS[label];
  if (key) return t(key);
  return label;
}

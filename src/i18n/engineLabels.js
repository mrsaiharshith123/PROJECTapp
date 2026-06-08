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

/**
 * @param {(key: string, params?: object) => string} t
 * @param {{ key?: string, params?: object, text?: string } | string | null | undefined} item
 */
export function translateEngineMessage(t, item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (item.key) return t(item.key, item.params || {});
  return item.text || "";
}

/**
 * @param {(key: string, params?: object) => string} t
 * @param {Array<{ key?: string, params?: object, text?: string } | string>} items
 * @param {string} [sep]
 */
export function joinEngineMessages(t, items, sep = " · ") {
  return items.map((i) => translateEngineMessage(t, i)).filter(Boolean).join(sep);
}

/**
 * Apply a saved id order to the default tool list for a mode.
 * Unknown ids are dropped; missing ids are appended in default order.
 * @param {Array<{ id: string } & Record<string, unknown>>} defaultWidgets
 * @param {string[] | undefined} savedOrder
 */
/** @returns {Array<{ id: string } & Record<string, unknown>>} */
export function orderDashboardWidgets(defaultWidgets, savedOrder) {
  if (!Array.isArray(defaultWidgets) || defaultWidgets.length === 0) return [];
  const defaultIds = defaultWidgets.map((w) => w.id);
  const allowed = new Set(defaultIds);
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) return [...defaultWidgets];

  const seen = new Set();
  /** @type {Array<{ id: string } & Record<string, unknown>>} */
  const out = [];
  for (const id of savedOrder) {
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    const w = defaultWidgets.find((x) => x.id === id);
    if (w) out.push(w);
  }
  for (const w of defaultWidgets) {
    if (!seen.has(w.id)) out.push(w);
  }
  return out;
}

const VALID_TOOL_ORDER_MODES = new Set(["salaried", "business", "family", "power"]);
const REMOVED_TOOL_ORDER_MODES = new Set(["freelancer", "student"]);
const TOOL_ORDER_MODE_PRIORITY = ["salaried", "business", "family", "power"];

function toolOrderModeSortKey(mode) {
  if (REMOVED_TOOL_ORDER_MODES.has(mode)) return 100;
  const i = TOOL_ORDER_MODE_PRIORITY.indexOf(mode);
  return i >= 0 ? i : 99;
}

/**
 * @param {unknown} raw
 * @returns {Record<string, string[]>}
 */
export function normalizeDashboardToolOrderByMode(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return /** @type {Record<string, string[]>} */ ({});
  /** @type {Record<string, string[]>} */
  const out = {};
  const entries = Object.entries(raw).sort(
    ([a], [b]) => toolOrderModeSortKey(a) - toolOrderModeSortKey(b),
  );
  for (const [mode, arr] of entries) {
    if (typeof mode !== "string" || mode.length > 20) continue;
    if (!Array.isArray(arr)) continue;
    const ids = arr.map((x) => String(x || "").trim()).filter(Boolean);
    if (ids.length === 0) continue;

    let key = mode;
    if (REMOVED_TOOL_ORDER_MODES.has(mode)) key = "salaried";
    if (!VALID_TOOL_ORDER_MODES.has(key)) continue;

    if (out[key]) {
      const seen = new Set(out[key]);
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.add(id);
          out[key].push(id);
        }
      }
    } else {
      out[key] = ids;
    }
  }
  return out;
}

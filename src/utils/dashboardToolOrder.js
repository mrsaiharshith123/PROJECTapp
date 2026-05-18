/**
 * Apply a saved id order to the default tool list for a mode.
 * Unknown ids are dropped; missing ids are appended in default order.
 * @param {{ id: string }[]} defaultWidgets
 * @param {string[] | undefined} savedOrder
 */
export function orderDashboardWidgets(defaultWidgets, savedOrder) {
  if (!Array.isArray(defaultWidgets) || defaultWidgets.length === 0) return [];
  const defaultIds = defaultWidgets.map((w) => w.id);
  const allowed = new Set(defaultIds);
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) return [...defaultWidgets];

  const seen = new Set();
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

/**
 * @param {unknown} raw
 * @returns {Record<string, string[]>}
 */
export function normalizeDashboardToolOrderByMode(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [mode, arr] of Object.entries(raw)) {
    if (typeof mode !== "string" || mode.length > 20) continue;
    if (!Array.isArray(arr)) continue;
    out[mode] = arr.map((x) => String(x || "").trim()).filter(Boolean);
  }
  return out;
}

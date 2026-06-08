/** Reorderable home quick actions (calendar and add stay pinned first). */
export const HOME_QUICK_ACTION_IDS = ["lending", "income", "calculators", "analytics"];

const ALLOWED = new Set(HOME_QUICK_ACTION_IDS);

/**
 * @param {string[] | undefined} savedOrder
 * @returns {string[]}
 */
export function orderHomeQuickActions(savedOrder) {
  const defaultOrder = [...HOME_QUICK_ACTION_IDS];
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) return defaultOrder;

  const seen = new Set();
  /** @type {string[]} */
  const out = [];
  for (const raw of savedOrder) {
    const id = String(raw || "").trim();
    if (!ALLOWED.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * @param {string[] | undefined} visibleOrder
 * @returns {string[]}
 */
export function hiddenHomeQuickActions(visibleOrder) {
  const visible = new Set(orderHomeQuickActions(visibleOrder));
  return HOME_QUICK_ACTION_IDS.filter((id) => !visible.has(id));
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeHomeQuickActionOrder(raw) {
  if (!Array.isArray(raw)) return [];
  return orderHomeQuickActions(raw.map((x) => String(x || "").trim()).filter(Boolean));
}

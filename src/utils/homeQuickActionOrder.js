/** Reorderable home quick actions — calendar stays pinned in UI. */
export const HOME_QUICK_ACTION_IDS = [
  "add_bill",
  "bills",
  "log_spend",
  "lending",
  "income",
  "analytics",
  "paycheck",
  "profile",
  "calculators",
  "tool_planner",
  "tool_loan",
  "tool_tax",
  "tool_retirement",
  "tool_safety",
  "tool_chit",
];

const ALLOWED = new Set(HOME_QUICK_ACTION_IDS);

const DEFAULT_VISIBLE = ["lending", "income", "calculators", "analytics"];

/**
 * @param {string[] | undefined} savedOrder
 * @returns {string[]}
 */
export function orderHomeQuickActions(savedOrder) {
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) return [...DEFAULT_VISIBLE];

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

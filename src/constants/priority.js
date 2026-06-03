/** @typedef {"critical" | "medium" | "low"} PriorityId */

/** @type {{ id: PriorityId, label: string, rank: number }[]} */
export const PRIORITIES = [
  { id: "critical", label: "Critical", rank: 0 },
  { id: "medium", label: "Medium", rank: 1 },
  { id: "low", label: "Low", rank: 2 },
];

const byId = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]));

export function getPriorityById(id) {
  return byId[id] || byId.medium;
}

export function priorityRank(id) {
  return getPriorityById(id).rank;
}

/** Infer default priority from commitment category label/id */
export function inferPriorityFromCategory(categoryId) {
  const c = String(categoryId || "");
  if (
    c === "EMI" ||
    c === "Credit Card" ||
    c === "Loan" ||
    c === "BNPL" ||
    c === "Payroll" ||
    c === "Tax" ||
    c === "Chit Fund"
  )
    return "critical";
  if (c === "Subscription" || c === "SIP" || c === "Software" || c === "Food" || c === "Transport") return "low";
  if (
    c === "Insurance" ||
    c === "Rent" ||
    c === "Utility" ||
    c === "Vendor" ||
    c === "School" ||
    c === "Groceries" ||
    c === "Education"
  )
    return "medium";
  return "medium";
}

/** Shown only when category is Other — user picks urgency. */
export const OTHER_PRIORITY_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "critical", label: "High" },
];

/** @typedef {"critical" | "medium" | "low"} PriorityId */

/** @type {{ id: PriorityId, label: string, badgeClass: string, rank: number }[]} */
export const PRIORITIES = [
  { id: "critical", label: "Critical", badgeClass: "bg-red-100 text-red-700 border-red-200", rank: 0 },
  { id: "medium", label: "Medium", badgeClass: "bg-amber-100 text-amber-800 border-amber-200", rank: 1 },
  { id: "low", label: "Low", badgeClass: "bg-slate-100 text-slate-600 border-slate-200", rank: 2 },
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
  if (c === "EMI" || c === "Credit Card" || c === "Loan") return "critical";
  if (c === "Subscription" || c === "SIP") return "low";
  if (c === "Insurance" || c === "Rent" || c === "Utility") return "medium";
  return "medium";
}

/** Shown only when category is Other — user picks urgency. */
export const OTHER_PRIORITY_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "critical", label: "High" },
];

/** @typedef {{ id: string, label: string, icon: string, chipClass: string }} Category */

/** @type {Category[]} */
export const CATEGORIES = [
  { id: "EMI", label: "EMI", icon: "🏦", chipClass: "bg-violet-100 text-violet-800 border-violet-200" },
  { id: "Credit Card", label: "Credit Card", icon: "💳", chipClass: "bg-rose-100 text-rose-800 border-rose-200" },
  { id: "Subscription", label: "Subscription", icon: "📺", chipClass: "bg-sky-100 text-sky-800 border-sky-200" },
  { id: "Insurance", label: "Insurance", icon: "🛡️", chipClass: "bg-teal-100 text-teal-800 border-teal-200" },
  { id: "SIP", label: "SIP", icon: "📈", chipClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "Rent", label: "Rent", icon: "🏠", chipClass: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "Loan", label: "Loan", icon: "📄", chipClass: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { id: "Utility", label: "Utility", icon: "⚡", chipClass: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { id: "Other", label: "Other", icon: "📌", chipClass: "bg-gray-100 text-gray-700 border-gray-200" },
];

const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function getCategoryById(id) {
  return byId[id] || byId.Other;
}

/** Categories where annual interest % is relevant for payoff intel. */
const INTEREST_RATE_CATEGORIES = new Set(["EMI", "Loan", "Credit Card"]);

export function categoryShowsInterestRate(categoryId) {
  return INTEREST_RATE_CATEGORIES.has(categoryId);
}

export function categoryShowsInsuranceFields(categoryId) {
  return categoryId === "Insurance";
}

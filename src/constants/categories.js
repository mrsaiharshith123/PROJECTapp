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
  { id: "Vendor", label: "Vendor / supplier", icon: "📦", chipClass: "bg-orange-100 text-orange-900 border-orange-200" },
  { id: "Payroll", label: "Payroll / staff", icon: "👥", chipClass: "bg-blue-100 text-blue-900 border-blue-200" },
  { id: "Software", label: "Software / SaaS", icon: "💻", chipClass: "bg-sky-100 text-sky-900 border-sky-200" },
  { id: "Tax", label: "Tax / compliance", icon: "📋", chipClass: "bg-stone-100 text-stone-800 border-stone-200" },
  { id: "Client", label: "Client / project cost", icon: "🤝", chipClass: "bg-indigo-100 text-indigo-900 border-indigo-200" },
  { id: "Equipment", label: "Equipment", icon: "🛠️", chipClass: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "School", label: "School / education", icon: "🎒", chipClass: "bg-lime-100 text-lime-900 border-lime-200" },
  { id: "Groceries", label: "Groceries / household", icon: "🛒", chipClass: "bg-green-100 text-green-900 border-green-200" },
  { id: "Education", label: "Education / fees", icon: "📚", chipClass: "bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id: "Transport", label: "Transport", icon: "🚌", chipClass: "bg-amber-100 text-amber-900 border-amber-200" },
  { id: "Food", label: "Food & daily", icon: "🍽️", chipClass: "bg-orange-100 text-orange-800 border-orange-200" },
  { id: "BNPL", label: "BNPL / pay-later", icon: "⏳", chipClass: "bg-rose-100 text-rose-900 border-rose-200" },
  { id: "Other", label: "Other", icon: "📌", chipClass: "bg-gray-100 text-gray-700 border-gray-200" },
];

const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function getCategoryById(id) {
  return byId[id] || byId.Other;
}

/** Categories where annual interest % is relevant for payoff intel. */
const INTEREST_RATE_CATEGORIES = new Set(["EMI", "Loan", "Credit Card", "BNPL", "Equipment"]);

export function categoryShowsInterestRate(categoryId) {
  return INTEREST_RATE_CATEGORIES.has(categoryId);
}

export function categoryShowsInsuranceFields(categoryId) {
  return categoryId === "Insurance";
}

/** @typedef {{ id: string, label: string, icon: string }} Category */

/** @type {Category[]} */
export const CATEGORIES = [
  { id: "EMI", label: "EMI", icon: "🏦" },
  { id: "Credit Card", label: "Credit Card", icon: "💳" },
  { id: "Subscription", label: "Subscription", icon: "📺" },
  { id: "Insurance", label: "Insurance", icon: "🛡️" },
  { id: "SIP", label: "SIP", icon: "📈" },
  { id: "Chit Fund", label: "Chit fund", icon: "🪙" },
  { id: "Rent", label: "Rent", icon: "🏠" },
  { id: "Loan", label: "Loan", icon: "📄" },
  { id: "Utility", label: "Utility", icon: "⚡" },
  { id: "Vendor", label: "Vendor / supplier", icon: "📦" },
  { id: "Payroll", label: "Payroll / staff", icon: "👥" },
  { id: "Software", label: "Software / SaaS", icon: "💻" },
  { id: "Tax", label: "Tax / compliance", icon: "📋" },
  { id: "Client", label: "Client / project cost", icon: "🤝" },
  { id: "Equipment", label: "Equipment", icon: "🛠️" },
  { id: "School", label: "School / education", icon: "🎒" },
  { id: "Groceries", label: "Groceries / household", icon: "🛒" },
  { id: "Education", label: "Education / fees", icon: "📚" },
  { id: "Transport", label: "Transport", icon: "🚌" },
  { id: "Food", label: "Food & daily", icon: "🍽️" },
  { id: "BNPL", label: "BNPL / pay-later", icon: "⏳" },
  { id: "Other", label: "Other", icon: "📌" },
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

export function categoryShowsChitFundFields(categoryId) {
  return categoryId === "Chit Fund";
}

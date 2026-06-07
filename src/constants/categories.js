/** @typedef {{ id: string, label: string, icon: string }} Category */

/** @type {Category[]} */
export const CATEGORIES = [
  { id: "EMI", label: "EMI", icon: "bank" },
  { id: "Credit Card", label: "Credit Card", icon: "credit-card" },
  { id: "Subscription", label: "Subscription", icon: "television" },
  { id: "Insurance", label: "Insurance", icon: "shield" },
  { id: "SIP", label: "SIP", icon: "chart-line-up" },
  { id: "Chit Fund", label: "Chit fund", icon: "coins" },
  { id: "Rent", label: "Rent", icon: "house" },
  { id: "Loan", label: "Loan", icon: "file-text" },
  { id: "Utility", label: "Utility", icon: "lightning" },
  { id: "Vendor", label: "Vendor / supplier", icon: "package" },
  { id: "Payroll", label: "Payroll / staff", icon: "users" },
  { id: "Software", label: "Software / SaaS", icon: "laptop" },
  { id: "Tax", label: "Tax / compliance", icon: "clipboard-text" },
  { id: "Client", label: "Client / project cost", icon: "handshake" },
  { id: "Equipment", label: "Equipment", icon: "wrench" },
  { id: "School", label: "School / education", icon: "backpack" },
  { id: "Groceries", label: "Groceries / household", icon: "shopping-cart" },
  { id: "Education", label: "Education / fees", icon: "book-open" },
  { id: "Transport", label: "Transport", icon: "bus" },
  { id: "Food", label: "Food & daily", icon: "fork-knife" },
  { id: "BNPL", label: "BNPL / pay-later", icon: "hourglass" },
  { id: "Other", label: "Other", icon: "push-pin" },
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

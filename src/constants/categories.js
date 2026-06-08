/** @typedef {{ id: string, label: string, icon: string, activeIcon: string }} Category */

/** @type {Category[]} */
export const CATEGORIES = [
  { id: "EMI", label: "EMI", icon: "bank", activeIcon: "bank" },
  { id: "Credit Card", label: "Credit Card", icon: "credit-card", activeIcon: "credit-card" },
  { id: "Subscription", label: "Subscription", icon: "television", activeIcon: "television" },
  { id: "Insurance", label: "Insurance", icon: "shield", activeIcon: "shield" },
  { id: "SIP", label: "SIP", icon: "chart-line-up", activeIcon: "chart-line-up" },
  { id: "Chit Fund", label: "Chit fund", icon: "coins", activeIcon: "coins" },
  { id: "Rent", label: "Rent", icon: "house", activeIcon: "house" },
  { id: "Loan", label: "Loan", icon: "file-text", activeIcon: "file-text" },
  { id: "Utility", label: "Utility", icon: "lightning", activeIcon: "lightning" },
  { id: "Vendor", label: "Vendor / supplier", icon: "package", activeIcon: "package" },
  { id: "Payroll", label: "Payroll / staff", icon: "users", activeIcon: "users" },
  { id: "Software", label: "Software / SaaS", icon: "laptop", activeIcon: "laptop" },
  { id: "Tax", label: "Tax / compliance", icon: "clipboard-text", activeIcon: "clipboard-text" },
  { id: "Client", label: "Client / project cost", icon: "handshake", activeIcon: "handshake" },
  { id: "Equipment", label: "Equipment", icon: "wrench", activeIcon: "wrench" },
  { id: "School", label: "School / education", icon: "backpack", activeIcon: "backpack" },
  { id: "Groceries", label: "Groceries / household", icon: "shopping-cart", activeIcon: "shopping-cart" },
  { id: "Education", label: "Education / fees", icon: "book-open", activeIcon: "book-open" },
  { id: "Transport", label: "Transport", icon: "bus", activeIcon: "bus" },
  { id: "Food", label: "Food & daily", icon: "fork-knife", activeIcon: "fork-knife" },
  { id: "BNPL", label: "BNPL / pay-later", icon: "hourglass", activeIcon: "hourglass" },
  { id: "Other", label: "Other", icon: "push-pin", activeIcon: "push-pin" },
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

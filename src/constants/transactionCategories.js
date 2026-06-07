/**
 * Transaction life categories — behavioral layer above bill categories.
 * @typedef {'survival'|'lifestyle'|'growth'|'pressure'|'risk'} TransactionLifeCategory
 */

export const TRANSACTION_LIFE_CATEGORIES = [
  { id: "survival", label: "Survival" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "growth", label: "Growth" },
  { id: "pressure", label: "Pressure" },
  { id: "risk", label: "Risk" },
];

const BILL_TO_LIFE = {
  Rent: "survival",
  Utility: "survival",
  Groceries: "survival",
  Insurance: "survival",
  Food: "lifestyle",
  Transport: "lifestyle",
  Subscription: "lifestyle",
  School: "growth",
  Education: "growth",
  SIP: "growth",
  Software: "growth",
  Equipment: "growth",
  EMI: "pressure",
  Loan: "pressure",
  "Credit Card": "pressure",
  BNPL: "pressure",
  "Chit Fund": "pressure",
  Tax: "pressure",
  Vendor: "pressure",
  Payroll: "pressure",
  Client: "pressure",
  Other: "risk",
};

/** @param {string} [billCategoryId] */
export function lifeCategoryForBillCategory(billCategoryId) {
  return BILL_TO_LIFE[billCategoryId] || "risk";
}

/** @param {TransactionLifeCategory} id */
export function getTransactionLifeCategoryMeta(id) {
  return TRANSACTION_LIFE_CATEGORIES.find((c) => c.id === id) || TRANSACTION_LIFE_CATEGORIES[4];
}

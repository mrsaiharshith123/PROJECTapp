/** Maps category id → ct-cat-* tone (presentation only; data stays in constants/categories.js) */
const TONE_BY_CATEGORY = {
  EMI: "violet",
  "Credit Card": "rose",
  Subscription: "sky",
  Insurance: "teal",
  SIP: "emerald",
  "Chit Fund": "amber",
  Rent: "amber",
  Loan: "violet",
  Utility: "amber",
  Vendor: "orange",
  Payroll: "sky",
  Software: "sky",
  Tax: "neutral",
  Client: "violet",
  Equipment: "neutral",
  School: "lime",
  Groceries: "emerald",
  Education: "sky",
  Transport: "amber",
  Food: "orange",
  BNPL: "rose",
  Other: "neutral",
};

export function categoryChipClass(categoryId) {
  const tone = TONE_BY_CATEGORY[categoryId] || "neutral";
  return tone === "neutral" ? "ct-cat ct-cat-neutral" : `ct-cat ct-cat-${tone}`;
}

import { startOfMonth, addMonths, format } from "date-fns";

export const QUICK_COMMITMENT_TEMPLATES = [
  { label: "Home / rent", category: "Rent", defaultAmount: 15000 },
  { label: "Home loan EMI", category: "EMI", defaultAmount: 25000 },
  { label: "Car loan EMI", category: "EMI", defaultAmount: 8000 },
  { label: "OTT / streaming", category: "Subscription", defaultAmount: 649 },
  { label: "Insurance", category: "Insurance", defaultAmount: 2000 },
  { label: "SIP / MF", category: "SIP", defaultAmount: 5000 },
  { label: "Chit fund", category: "Chit Fund", defaultAmount: 3000 },
  { label: "School fees", category: "School", defaultAmount: 10000 },
  { label: "Credit card", category: "Credit Card", defaultAmount: 5000 },
  { label: "Electricity", category: "Utility", defaultAmount: 1200 },
];

/** First day of next calendar month (YYYY-MM-DD). */
export function firstOfNextMonth(ref = new Date()) {
  const next = startOfMonth(addMonths(ref, 1));
  return format(next, "yyyy-MM-dd");
}

/**
 * @param {{ label: string, category: string, defaultAmount: number }} template
 * @param {number} overrideAmount
 */
export function templateToCommitment(template, overrideAmount) {
  const amount = Math.max(0, Number(overrideAmount ?? template.defaultAmount) || 0);
  return {
    name: template.label,
    category: template.category,
    amount,
    remainingAmount: amount,
    repeatType: "monthly",
    priority: "medium",
    dueDate: firstOfNextMonth(),
    startDate: firstOfNextMonth(),
    status: "pending",
  };
}

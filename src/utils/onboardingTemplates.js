import { startOfMonth, addMonths, format } from "date-fns";

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

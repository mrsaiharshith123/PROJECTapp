/**
 * Turn raw KPI labels into human interpretation (display-only).
 * @param {string} label
 * @param {string} value
 */
export function interpretHomeMetric(label, value) {
  const map = {
    "Pay streak": "Consistency logging payments — builds trust in your own data.",
    "Bill control": "Penalty for overdue and critical open bills; 100 means nothing urgent.",
    "Amount due": "Upcoming obligations are due this month.",
    "Cash left": "After typical dues, this is your flexibility for goals and surprises.",
    "Household cash": "Shared income minus household dues this month.",
    Stability: "A blended read of dues, paid status, and income room.",
    "Total bills": "Everything you are actively tracking.",
    Overdue: "Bills past due date — tap Bills to pay or update.",
    "Household due": "Shared bills due this month.",
    Committed: "How much household income recurring bills consume.",
    "School fees open": "Education dues still outstanding.",
    "Household safety": "How comfortably shared obligations fit income.",
  };

  if (map[label]) return map[label];

  return `${label} (${value}) — tap ℹ on metrics when available for more context.`;
}

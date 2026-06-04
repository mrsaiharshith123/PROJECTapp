/**
 * Turn raw KPI labels into human interpretation (display-only).
 * @param {string} label
 * @param {string} value
 * @param {{ mode?: string }} ctx
 */
export function interpretHomeMetric(label, value, ctx = {}) {
  const mode = ctx.mode || "salaried";
  const map = {
    "Amount due": "Upcoming obligations are due this month.",
    "Cash left": "After typical dues, this is your flexibility for goals and surprises.",
    "Household cash": "Shared income minus household dues this month.",
    Stability: "A blended read of dues, paid status, and income room.",
    "Total bills": "Everything you are actively tracking.",
    Receivables: "Cash still expected from customers.",
    "Payables due": "Vendor and operating bills waiting to be paid.",
    "Net position": "Receivables minus near-term payables — your operating cushion.",
    "Business stability": "Collections, payables, and obligations together.",
    "Household due": "Shared bills due this month.",
    Committed: "How much household income recurring bills consume.",
    "School fees open": "Education dues still outstanding.",
    "Household safety": "How comfortably shared obligations fit income.",
  };

  if (map[label]) return map[label];

  if (mode === "business") return `${label} (${value}) — part of your operating picture.`;
  return `${label} (${value}) — tap ℹ on metrics when available for more context.`;
}

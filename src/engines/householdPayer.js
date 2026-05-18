/** @param {string} raw */
export function normalizeHouseholdPayer(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "primary" || v === "secondary" || v === "shared") return v;
  return "";
}

/**
 * Approximate open amounts by who pays (family labels — does not change math totals).
 */
export function summarizeHouseholdPayerBurden(commitments, getEffectiveStatus) {
  const by = { primary: 0, secondary: 0, shared: 0, unset: 0 };

  for (const c of commitments) {
    if (getEffectiveStatus(c) === "paid") continue;
    const p = normalizeHouseholdPayer(c.householdPayer);
    const key = p === "primary" ? "primary" : p === "secondary" ? "secondary" : p === "shared" ? "shared" : "unset";
    const amt = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
    by[key] += amt;
  }
  return { by };
}

/**
 * One short insight for family dashboard when payer tags are used.
 */
export function householdPayerInsight(commitments, getEffectiveStatus, secondaryIncomeMonthly) {
  const { by } = summarizeHouseholdPayerBurden(commitments, getEffectiveStatus);
  const hasTags = by.primary > 0 || by.secondary > 0 || by.shared > 0;
  if (!hasTags) return null;

  const parts = [];
  if (by.primary > 0) parts.push(`primary earner ~₹${Math.round(by.primary).toLocaleString("en-IN")}/mo open`);
  if (by.secondary > 0) parts.push(`second income ~₹${Math.round(by.secondary).toLocaleString("en-IN")}/mo open`);
  if (by.shared > 0) parts.push(`shared ~₹${Math.round(by.shared).toLocaleString("en-IN")}/mo open`);
  if (by.unset > 0) parts.push(`untagged ~₹${Math.round(by.unset).toLocaleString("en-IN")}/mo open`);

  let text = `Bills by payer (approx. open amounts): ${parts.join(" · ")}.`;
  if (secondaryIncomeMonthly > 0 && by.secondary > 0) {
    text += " If second income paused, revisit bills tagged to second earner.";
  }
  return { id: "household-payer-split", tone: /** @type {const} */ ("info"), text };
}

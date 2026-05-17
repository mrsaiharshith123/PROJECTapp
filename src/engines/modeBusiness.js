/**
 * Lightweight business cashflow from lending (receivables) + vendor-style bills.
 */
export function computeBusinessCashflow(commitments, lendings, getEffectiveStatus, getEffectiveLendingStatus, todayStr) {
  const receivables = lendings.filter((l) => l.type === "lent" && Number(l.remainingAmount) > 0);
  const payables = lendings.filter((l) => l.type === "borrowed" && Number(l.remainingAmount) > 0);

  const totalReceivables = receivables.reduce((s, l) => s + Number(l.remainingAmount), 0);
  const overdueReceivables = receivables.filter((l) => getEffectiveLendingStatus(l, todayStr) === "overdue");
  const overdueRecvAmount = overdueReceivables.reduce((s, l) => s + Number(l.remainingAmount), 0);

  const vendorBills = commitments.filter(
    (c) =>
      ["Utility", "Subscription", "Rent", "Loan", "Other"].includes(c.category) &&
      getEffectiveStatus(c) !== "paid"
  );
  const vendorDue = vendorBills.reduce((s, c) => s + Math.max(0, Number(c.remainingAmount ?? c.amount)), 0);

  const insights = [];
  if (overdueReceivables.length > 0) {
    insights.push({
      id: "biz-overdue-recv",
      tone: "warning",
      text: `₹${Math.round(overdueRecvAmount).toLocaleString()} receivables are overdue — cashflow pressure may rise.`,
    });
  }
  if (totalReceivables > vendorDue * 1.5 && vendorDue > 0) {
    insights.push({
      id: "biz-recv-delay",
      tone: "info",
      text: "Expected incoming payments exceed near-term vendor dues — still watch collection delays.",
    });
  }

  let stabilityScore = 70;
  if (overdueReceivables.length > 2) stabilityScore -= 15;
  if (payables.length > 3) stabilityScore -= 10;
  stabilityScore = Math.max(0, Math.min(100, stabilityScore));

  return {
    totalReceivables: Math.round(totalReceivables),
    receivableCount: receivables.length,
    overdueReceivables: overdueReceivables.length,
    overdueRecvAmount: Math.round(overdueRecvAmount),
    payablesAmount: payables.reduce((s, l) => s + Number(l.remainingAmount), 0),
    vendorDue: Math.round(vendorDue),
    stabilityScore,
    stabilityLabel: stabilityScore >= 70 ? "Stable" : stabilityScore >= 50 ? "Watch" : "Stressed",
    insights,
  };
}

import { openInvoiceAmount, isInvoiceOverdue } from "../utils/businessInvoices.js";

/**
 * Lightweight business cashflow from lending (receivables) + vendor-style bills + client invoices.
 */
export function computeBusinessCashflow(
  commitments,
  lendings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  invoices = []
) {
  const receivables = lendings.filter((l) => l.type === "lent" && Number(l.remainingAmount) > 0);
  const openInvoices = (invoices || []).filter((i) => !i.paid);
  const invoiceOpenTotal = openInvoices.reduce((s, i) => s + openInvoiceAmount(i), 0);
  const overdueInvoices = openInvoices.filter((i) => isInvoiceOverdue(i, todayStr));
  const payables = lendings.filter((l) => l.type === "borrowed" && Number(l.remainingAmount) > 0);

  const lendingReceivables = receivables.reduce((s, l) => s + Number(l.remainingAmount), 0);
  const totalReceivables = lendingReceivables + invoiceOpenTotal;
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
  if (overdueInvoices.length > 0) {
    const invAmt = overdueInvoices.reduce((s, i) => s + openInvoiceAmount(i), 0);
    insights.push({
      id: "biz-overdue-invoice",
      tone: "warning",
      text: `${overdueInvoices.length} client invoice(s) overdue (₹${Math.round(invAmt).toLocaleString()}) — send a reminder.`,
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
    lendingReceivables: Math.round(lendingReceivables),
    invoiceOpenTotal: Math.round(invoiceOpenTotal),
    receivableCount: receivables.length + openInvoices.length,
    overdueReceivables: overdueReceivables.length,
    overdueRecvAmount: Math.round(overdueRecvAmount),
    payablesAmount: payables.reduce((s, l) => s + Number(l.remainingAmount), 0),
    vendorDue: Math.round(vendorDue),
    stabilityScore,
    stabilityLabel: stabilityScore >= 70 ? "Stable" : stabilityScore >= 50 ? "Watch" : "Stressed",
    insights,
  };
}

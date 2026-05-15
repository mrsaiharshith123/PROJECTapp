/**
 * @param {{ amount: number, date: string }[]} payments
 */
export function totalPaidOnPayments(payments) {
  if (!Array.isArray(payments)) return 0;
  return payments.reduce((s, p) => s + Math.max(0, Number(p.amount) || 0), 0);
}

/**
 * @param {object} c commitment
 * @param {{ amount: number, date: string }} payment
 * @returns {object} updated commitment
 */
export function applyPaymentToCommitment(c, payment) {
  const payAmt = Math.max(0, Number(payment.amount) || 0);
  const date = payment.date || "";
  const amount = Math.max(0, Number(c.amount) || 0);
  const prevPaid = totalPaidOnPayments(c.payments);
  const remainingBefore = Math.max(0, amount - prevPaid);
  const applied = Math.min(payAmt, remainingBefore);
  const newPayments = [...(c.payments || []), { amount: applied, date }];
  const newRemaining = Math.max(0, amount - totalPaidOnPayments(newPayments));
  const now = Date.now();
  return {
    ...c,
    payments: newPayments,
    remainingAmount: newRemaining,
    updatedAt: now,
  };
}

/**
 * Match a parsed debit to an open commitment.
 * @param {{ amount: number, bank: string, last4: string | null, date: string }} debit
 * @param {object[]} commitments
 * @param {(c: object) => string} getEffectiveStatus
 */
export function matchDebitToCommitment(debit, commitments, getEffectiveStatus) {
  if (!debit || !Array.isArray(commitments)) return null;
  const amount = Number(debit.amount) || 0;
  if (amount <= 0) return null;

  const candidates = commitments.filter((c) => {
    if (getEffectiveStatus(c) === "paid") return false;
    const billAmt = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
    if (billAmt <= 0) return false;
    const diff = Math.abs(billAmt - amount) / amount;
    return diff < 0.05;
  });

  if (candidates.length === 0) return null;

  const target = debit.date || "";
  candidates.sort((a, b) => {
    const da = Math.abs(daysBetween(a.dueDate, target));
    const db = Math.abs(daysBetween(b.dueDate, target));
    return da - db;
  });

  return candidates[0];
}

function daysBetween(a, b) {
  if (!a || !b) return 9999;
  try {
    const t1 = new Date(`${a}T12:00:00`).getTime();
    const t2 = new Date(`${b}T12:00:00`).getTime();
    return Math.round(Math.abs(t1 - t2) / 86400000);
  } catch {
    return 9999;
  }
}

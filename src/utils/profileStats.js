import { format, subMonths } from "date-fns";

/**
 * Months in a row (from this month backward) with at least one payment recorded.
 * @param {{ payments?: { date: string }[] }[]} commitments
 * @param {{ payments?: { date: string }[] }[]} lendings
 */
export function computePaymentMonthStreak(commitments, lendings) {
  const allDates = [];
  for (const c of commitments || []) {
    for (const p of c.payments || []) {
      if (p.date) allDates.push(p.date.slice(0, 7));
    }
  }
  for (const l of lendings || []) {
    for (const p of l.payments || []) {
      if (p.date) allDates.push(p.date.slice(0, 7));
    }
  }
  const monthsWithPay = new Set(allDates);
  let streak = 0;
  for (let i = 0; i < 36; i++) {
    const d = subMonths(new Date(), i);
    const key = format(d, "yyyy-MM");
    if (monthsWithPay.has(key)) streak += 1;
    else break;
  }
  return streak;
}

/**
 * Simple 0–100 score: penalize overdue and critical items still open.
 */
export function computeControlScore(commitments, getEffectiveStatus) {
  let score = 100;
  for (const c of commitments || []) {
    const eff = getEffectiveStatus(c);
    if (eff === "overdue") score -= 18;
    if (eff === "pending" && c.priority === "critical") score -= 6;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Flatten recent payments across commitments (newest first).
 */
export function recentCommitmentPaymentEvents(commitments, limit = 10) {
  const rows = [];
  for (const c of commitments || []) {
    let i = 0;
    for (const p of c.payments || []) {
      rows.push({
        id: `${c.id}-${p.date}-${p.amount}-${i++}`,
        name: c.name,
        amount: p.amount,
        date: p.date,
      });
    }
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows.slice(0, limit);
}

export function totalPaymentCountAndSum(commitments) {
  let count = 0;
  let sum = 0;
  for (const c of commitments || []) {
    for (const p of c.payments || []) {
      count += 1;
      sum += Math.max(0, Number(p.amount) || 0);
    }
  }
  return { count, sum };
}

export function outstandingLent(lendings) {
  return (lendings || [])
    .filter((l) => l.type === "lent" && Number(l.remainingAmount) > 0)
    .reduce((s, l) => s + Number(l.remainingAmount), 0);
}

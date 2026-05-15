/**
 * @param {object[]} lendings
 * @returns {{ personKey: string, displayName: string, totalDeals: number, successfulRepayments: number, delayedRepayments: number, completedCycles: number }[]}
 */
export function lendingTrustByPerson(lendings) {
  const map = new Map();

  for (const l of lendings || []) {
    const key = String(l.personName || "Unknown").trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        personKey: key,
        displayName: String(l.personName || "Unknown").trim(),
        totalDeals: 0,
        successfulRepayments: 0,
        delayedRepayments: 0,
        completedCycles: 0,
      });
    }
    const row = map.get(key);
    row.totalDeals += 1;
    for (const p of l.payments || []) {
      if (p.onTime === false) row.delayedRepayments += 1;
      else row.successfulRepayments += 1;
    }
    if (Number(l.remainingAmount) <= 0 && (l.status === "complete" || l.payments?.length)) {
      row.completedCycles += 1;
    }
  }

  return [...map.values()].sort((a, b) => b.totalDeals - a.totalDeals);
}

export function trustSummaryLine(personRow) {
  const n = personRow.successfulRepayments + personRow.delayedRepayments;
  if (n === 0) return `No repayments recorded yet with ${personRow.displayName}.`;
  return `You and ${personRow.displayName}: ${personRow.successfulRepayments} on-time repayments, ${personRow.delayedRepayments} delayed, ${personRow.completedCycles} settled entries.`;
}

/** Internal reliability score 0–100 (not a public credit score). */
export function trustScoreForPerson(personRow) {
  const total = personRow.successfulRepayments + personRow.delayedRepayments;
  if (total === 0) return 50;
  let score = Math.round((personRow.successfulRepayments / total) * 100);
  score += Math.min(10, personRow.completedCycles * 2);
  return Math.min(100, Math.max(0, score));
}

export function trustBadgeClass(score) {
  if (score >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 60) return "bg-sky-100 text-sky-800 border-sky-200";
  if (score >= 40) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export function trustScoreForLendingEntry(lending) {
  const rows = lendingTrustByPerson([lending]);
  if (!rows.length) return 50;
  return trustScoreForPerson(rows[0]);
}

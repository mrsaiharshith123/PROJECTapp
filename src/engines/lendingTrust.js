import { differenceInCalendarDays, parseISO } from "date-fns";

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

function paymentLatencies(lending) {
  const latencies = [];
  for (const p of lending.payments || []) {
    if (!p.date || !lending.dueDate) continue;
    try {
      const days = differenceInCalendarDays(
        parseISO(`${p.date}T12:00:00`),
        parseISO(`${lending.dueDate}T12:00:00`),
      );
      latencies.push(Math.max(0, days));
    } catch {
      latencies.push(p.onTime === false ? 5 : 0);
    }
  }
  return latencies;
}

function variance(nums) {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
  return nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
}

/**
 * Behavioural trust analysis for one person aggregate row + underlying lendings.
 * @param {object} personRow
 * @param {object[]} [lendingsForPerson]
 */
export function analyzeLendingTrust(personRow, lendingsForPerson = []) {
  const total = personRow.successfulRepayments + personRow.delayedRepayments;
  const latencies = [];
  let partialCount = 0;
  let paymentCount = 0;

  for (const l of lendingsForPerson) {
    latencies.push(...paymentLatencies(l));
    for (const p of l.payments || []) {
      paymentCount += 1;
      const rem = Number(l.remainingAmount) || 0;
      const totalAmt = Number(l.totalPayable ?? l.totalAmount) || 0;
      if (p.amount > 0 && rem > 0 && p.amount < totalAmt * 0.95) partialCount += 1;
    }
  }

  const lateOnly = latencies.filter((d) => d > 0);
  const avgDaysLate =
    lateOnly.length > 0 ? Math.round((lateOnly.reduce((s, d) => s + d, 0) / lateOnly.length) * 10) / 10 : 0;
  const latencyVariance = Math.round(variance(latencies) * 10) / 10;
  const partialPaymentRatio = paymentCount > 0 ? Math.round((partialCount / paymentCount) * 100) / 100 : 0;

  const recent = latencies.slice(-3);
  const older = latencies.slice(0, Math.max(0, latencies.length - 3));
  const recentAvg = recent.length ? recent.reduce((s, d) => s + d, 0) / recent.length : 0;
  const olderAvg = older.length ? older.reduce((s, d) => s + d, 0) / older.length : 0;
  let trustTrajectory = "stable";
  if (recent.length >= 2 && recentAvg < olderAvg - 1) trustTrajectory = "improving";
  else if (recent.length >= 2 && recentAvg > olderAvg + 1) trustTrajectory = "deteriorating";

  const onTimeRate = total > 0 ? personRow.successfulRepayments / total : 0.5;
  const recoveryConsistency = personRow.completedCycles > 0 ? Math.min(1, personRow.completedCycles / personRow.totalDeals) : 0;
  const paymentDisciplineScore = clampScore(
    onTimeRate * 55 + recoveryConsistency * 25 + (1 - Math.min(1, partialPaymentRatio)) * 10 + (latencyVariance < 4 ? 10 : 0),
  );

  let pattern = "unknown";
  if (total === 0) pattern = "no_history";
  else if (onTimeRate >= 0.9 && avgDaysLate <= 1) pattern = "highly_reliable";
  else if (avgDaysLate >= 3 && avgDaysLate <= 7 && latencyVariance < 6) pattern = "consistently_late";
  else if (latencyVariance >= 12) pattern = "unpredictable";
  else if (trustTrajectory === "improving") pattern = "improving";
  else if (trustTrajectory === "deteriorating") pattern = "deteriorating";
  else if (partialPaymentRatio > 0.35) pattern = "partial_heavy";

  const confidence = clampScore(
    Math.min(100, 30 + total * 4 + personRow.completedCycles * 8 - latencyVariance * 2),
  );

  const narrativeLines = buildTrustNarratives({
    displayName: personRow.displayName,
    pattern,
    avgDaysLate,
    trustTrajectory,
    partialPaymentRatio,
  });

  return {
    ...personRow,
    avgDaysLate,
    latencyVariance,
    partialPaymentRatio,
    trustTrajectory,
    recoveryConsistency: Math.round(recoveryConsistency * 100) / 100,
    paymentDisciplineScore,
    pattern,
    confidence,
    narrativeLines,
    tone: trustScoreToTone(paymentDisciplineScore),
  };
}

function buildTrustNarratives({ displayName, pattern, avgDaysLate, trustTrajectory, partialPaymentRatio }) {
  const lines = [];
  const name = displayName || "This contact";

  switch (pattern) {
    case "highly_reliable":
      lines.push(`${name} pays on time with strong repayment discipline.`);
      break;
    case "consistently_late":
      lines.push(`Pays consistently but typically ${Math.max(1, Math.floor(avgDaysLate))}–${Math.ceil(avgDaysLate + 2)} days late.`);
      break;
    case "unpredictable":
      lines.push("Payment timing is highly inconsistent.");
      break;
    case "improving":
      lines.push("Recent repayment discipline has improved.");
      break;
    case "deteriorating":
      lines.push("Recent repayments show worsening timing.");
      break;
    case "partial_heavy":
      lines.push("Frequently makes partial payments before settling balances.");
      break;
    default:
      if (trustTrajectory === "improving") lines.push("Recent repayment discipline has improved.");
      break;
  }

  if (partialPaymentRatio > 0.4 && pattern !== "partial_heavy") {
    lines.push("Partial payments are common — monitor outstanding balances closely.");
  }

  return lines;
}

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function trustSummaryLine(personRow) {
  const n = personRow.successfulRepayments + personRow.delayedRepayments;
  if (n === 0) return `No repayments recorded yet with ${personRow.displayName}.`;
  return `You and ${personRow.displayName}: ${personRow.successfulRepayments} on-time repayments, ${personRow.delayedRepayments} delayed, ${personRow.completedCycles} settled entries.`;
}

/** Internal reliability score 0–100 (not a public credit score). */
export function trustScoreForPerson(personRow, lendingsForPerson = []) {
  if (lendingsForPerson.length > 0) {
    return analyzeLendingTrust(personRow, lendingsForPerson).paymentDisciplineScore;
  }
  const total = personRow.successfulRepayments + personRow.delayedRepayments;
  if (total === 0) return 50;
  let score = Math.round((personRow.successfulRepayments / total) * 100);
  score += Math.min(10, personRow.completedCycles * 2);
  return Math.min(100, Math.max(0, score));
}

/** Semantic tone for UI. */
export function trustScoreToTone(score) {
  if (score >= 80) return "success";
  if (score >= 60) return "info";
  if (score >= 40) return "warning";
  return "danger";
}

export function trustScoreForLendingEntry(lending, allLendings = []) {
  const rows = lendingTrustByPerson([lending]);
  if (!rows.length) return 50;
  const key = rows[0].personKey;
  const related = (allLendings || []).filter(
    (l) => String(l.personName || "").trim().toLowerCase() === key,
  );
  return trustScoreForPerson(rows[0], related.length ? related : [lending]);
}

import { totalOverdueAmount } from "./pressureScore.js";
import { computePaymentMonthStreak, computeControlScore } from "../utils/profileStats.js";

/**
 * Behavioural CIBIL-style estimate from tracked bills & lending (not bureau data).
 * @param {object} params
 */
export function simulateCibilBehavior({
  commitments = [],
  lendings = [],
  getEffectiveStatus,
  income = 0,
}) {
  const inc = Math.max(0, Number(income) || 0);
  const streak = computePaymentMonthStreak(commitments, lendings);
  const control = computeControlScore(commitments, getEffectiveStatus);
  const overdueAmt = totalOverdueAmount(commitments, getEffectiveStatus);
  const overdueRatio = inc > 0 ? overdueAmt / inc : overdueAmt > 0 ? 1 : 0;

  let cardUtil = 0;
  let openLoans = 0;
  for (const c of commitments) {
    const st = getEffectiveStatus(c);
    if (st === "paid" || st === "skipped") continue;
    if (c.category === "Credit Card") {
      const limit = Math.max(1, Number(c.creditLimit) || Number(c.amount) * 3 || 1);
      const bal = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
      cardUtil = Math.max(cardUtil, bal / limit);
    }
    if (c.category === "EMI" || c.category === "Loan") openLoans += 1;
  }

  let score = 720;
  score += Math.min(40, streak * 8);
  score += Math.round((control - 70) * 0.35);
  score -= Math.min(120, Math.round(overdueRatio * 200));
  score -= Math.min(80, Math.round(cardUtil * 100));
  score -= Math.min(40, openLoans * 6);

  const overdueCount = commitments.filter((c) => getEffectiveStatus(c) === "overdue").length;
  score -= overdueCount * 12;

  score = Math.max(300, Math.min(900, Math.round(score)));

  /** @type {"excellent" | "good" | "fair" | "weak"} */
  let band;
  let bandLabel;
  if (score >= 750) {
    band = "excellent";
    bandLabel = "Excellent";
  } else if (score >= 700) {
    band = "good";
    bandLabel = "Good";
  } else if (score >= 650) {
    band = "fair";
    bandLabel = "Fair";
  } else {
    band = "weak";
    bandLabel = "Needs attention";
  }

  const factors = [];
  if (streak >= 3) factors.push({ key: "positive_streak", weight: "high" });
  if (overdueCount > 0) factors.push({ key: "overdue_bills", weight: "high" });
  if (cardUtil > 0.5) factors.push({ key: "high_card_util", weight: "medium" });
  if (openLoans >= 4) factors.push({ key: "many_loans", weight: "medium" });
  if (control >= 80) factors.push({ key: "strong_control", weight: "low" });

  const narrativeLines = [];
  if (overdueCount > 0) {
    narrativeLines.push(`${overdueCount} overdue bill(s) are pulling the estimate down.`);
  }
  if (cardUtil > 0.4) {
    narrativeLines.push(`Credit card utilisation around ${Math.round(cardUtil * 100)}% — lenders prefer under 30%.`);
  }
  if (streak >= 3) {
    narrativeLines.push(`${streak}-month on-time payment streak supports a stronger profile.`);
  }
  if (narrativeLines.length === 0) {
    narrativeLines.push("Repayment behaviour looks steady based on data in CommitTrack.");
  }
  narrativeLines.push("Estimate only — not your official CIBIL score.");

  return {
    estimatedScore: score,
    band,
    bandLabel,
    paymentStreakMonths: streak,
    controlScore: control,
    overdueCount,
    cardUtilizationPct: Math.round(cardUtil * 100),
    openLoanCount: openLoans,
    factors,
    narrativeLines,
    tone: score >= 750 ? "success" : score >= 700 ? "info" : score >= 650 ? "warning" : "danger",
  };
}

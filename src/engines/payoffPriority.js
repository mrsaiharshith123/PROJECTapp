import { differenceInCalendarDays, parseISO } from "date-fns";
import { isActiveBill } from "../utils/billLifecycle.js";

/** Default annual % when user did not set `annualInterestRate` */
export function defaultAnnualRateForCategory(categoryId) {
  const c = String(categoryId || "");
  if (c === "Credit Card") return 36;
  if (c === "EMI" || c === "Loan") return 12;
  if (c === "Rent" || c === "Utility" || c === "Subscription") return 0;
  return 8;
}

export function effectiveAnnualRate(commitment) {
  const raw = commitment?.annualInterestRate;
  if (raw != null && !Number.isNaN(Number(raw)) && Number(raw) >= 0) {
    return Math.min(60, Math.max(0, Number(raw)));
  }
  return defaultAnnualRateForCategory(commitment?.category);
}

/** Rough monthly interest cost on remaining principal (for ranking). */
export function estimatedMonthlyInterestCost(commitment) {
  const rem = Math.max(0, Number(commitment.remainingAmount ?? commitment.amount ?? 0));
  const r = effectiveAnnualRate(commitment) / 100 / 12;
  return rem * r;
}

/**
 * Higher score = pay first.
 */
export function payoffPriorityScore(commitment, getEffectiveStatusFn, todayStr) {
  const eff = getEffectiveStatusFn(commitment);
  const rem = Math.max(0, Number(commitment.remainingAmount ?? 0));
  let score = 0;
  if (eff === "overdue") score += 500;
  if (commitment.priority === "critical") score += 120;
  else if (commitment.priority === "medium") score += 60;
  else score += 20;
  score += estimatedMonthlyInterestCost(commitment) / 100;
  score += rem / 5000;
  if (eff === "pending" && commitment.dueDate && todayStr) {
    try {
      const days = differenceInCalendarDays(
        parseISO(`${commitment.dueDate}T12:00:00`),
        parseISO(`${todayStr}T12:00:00`)
      );
      if (days >= 0 && days <= 7) score += 40;
    } catch {
      /* ignore */
    }
  }
  return score;
}

export function rankPayoffOrder(commitments, getEffectiveStatusFn, todayStr) {
  return commitments
    .filter((c) => {
      if (!isActiveBill(c, getEffectiveStatusFn, todayStr)) return false;
      const eff = getEffectiveStatusFn(c, todayStr);
      return (eff === "pending" || eff === "overdue") && Number(c.remainingAmount ?? 0) > 0;
    })
    .map((c) => ({
      commitment: c,
      score: payoffPriorityScore(c, getEffectiveStatusFn, todayStr),
    }))
    .sort((a, b) => b.score - a.score)
    .map((x, i) => ({ ...x, rank: i + 1 }));
}

export function topPayoffRecommendation(ranked) {
  if (!ranked.length) return null;
  const top = ranked[0].commitment;
  return {
    commitmentId: top.id,
    name: top.name,
    message: `Pay ${top.name} first to reduce pressure faster (overdue / interest / balance weighted).`,
  };
}

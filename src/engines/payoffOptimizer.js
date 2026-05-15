import { effectiveAnnualRate } from "./payoffPriority.js";

/**
 * Open debts for payoff strategies (commitments with remaining balance).
 */
export function debtsFromCommitments(commitments, getEffectiveStatusFn) {
  return commitments
    .filter((c) => getEffectiveStatusFn(c) !== "paid")
    .map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      balance: Math.max(0, Number(c.remainingAmount ?? c.amount ?? 0)),
      interestRate: effectiveAnnualRate(c),
      commitment: c,
    }))
    .filter((d) => d.balance > 0);
}

export function snowballOrder(debts) {
  return [...debts].sort((a, b) => a.balance - b.balance);
}

export function avalancheOrder(debts) {
  return [...debts].sort((a, b) => b.interestRate - a.interestRate);
}

/**
 * Rough estimate: months to clear list if paying minimum + rolling extra to focus debt.
 * Simplified: each debt cleared with fixed monthly pool split sequentially.
 */
export function estimatePayoffTimeline(debts, extraMonthly = 0) {
  if (!debts.length) return { months: 0, totalInterestApprox: 0 };
  let months = 0;
  let totalInterest = 0;
  const remaining = debts.map((d) => ({ ...d, bal: d.balance }));
  const pool = Math.max(0, extraMonthly) + remaining.reduce((s, d) => s + d.balance * 0.02, 0);

  while (remaining.some((d) => d.bal > 0.01) && months < 600) {
    months += 1;
    let paymentLeft = pool;
    for (const d of remaining) {
      if (d.bal <= 0) continue;
      const interest = d.bal * (d.interestRate / 100 / 12);
      totalInterest += interest;
      d.bal += interest;
      const pay = Math.min(d.bal, paymentLeft);
      d.bal -= pay;
      paymentLeft -= pay;
      if (paymentLeft <= 0) break;
    }
  }
  return { months, totalInterestApprox: totalInterest };
}

export function comparePayoffStrategies(commitments, getEffectiveStatusFn, extraMonthly = 0) {
  const debts = debtsFromCommitments(commitments, getEffectiveStatusFn);
  if (!debts.length) {
    return {
      debts: [],
      snowball: [],
      avalanche: [],
      recommendation: null,
    };
  }

  const snowball = snowballOrder(debts);
  const avalanche = avalancheOrder(debts);
  const snowTimeline = estimatePayoffTimeline(snowball, extraMonthly);
  const avTimeline = estimatePayoffTimeline(avalanche, extraMonthly);

  const recommendation =
    avTimeline.totalInterestApprox <= snowTimeline.totalInterestApprox
      ? {
          strategy: "avalanche",
          label: "Avalanche (highest interest first)",
          reason: `Typically saves more interest (~₹${Math.round(Math.max(0, snowTimeline.totalInterestApprox - avTimeline.totalInterestApprox)).toLocaleString()} vs snowball order in this estimate).`,
          firstPay: avalanche[0],
        }
      : {
          strategy: "snowball",
          label: "Snowball (smallest balance first)",
          reason: "Quick wins on small balances can build momentum; interest cost may be slightly higher.",
          firstPay: snowball[0],
        };

  return {
    debts,
    snowball,
    avalanche,
    snowTimeline,
    avTimeline,
    recommendation,
  };
}

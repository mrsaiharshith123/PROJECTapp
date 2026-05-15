import { totalMonthlyBurden } from "./burden.js";
import { commitmentToIncomeRatio } from "./pressureAdvanced.js";
import { computeCanonicalPressureScore } from "./pressureScore.js";

export function buildMonthlySnapshot(monthKey, commitments, income, getEffectiveStatusFn, monthlySnapshots = []) {
  const inc = Math.max(0, income || 0);
  const openRemaining = commitments.reduce((s, c) => {
    if (getEffectiveStatusFn(c) === "paid") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
  const overdueAmount = commitments.reduce((s, c) => {
    if (getEffectiveStatusFn(c) !== "overdue") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
  let paidMonth = 0;
  for (const c of commitments) {
    for (const p of c.payments || []) {
      if ((p.date || "").startsWith(monthKey)) paidMonth += Number(p.amount) || 0;
    }
  }
  const burden = totalMonthlyBurden(commitments, getEffectiveStatusFn);
  const freeMoney = inc - burden;
  const pressureScore = computeCanonicalPressureScore({
    commitments,
    income: inc,
    getEffectiveStatus: getEffectiveStatusFn,
    monthlySnapshots,
  });
  const commitmentRatio = commitmentToIncomeRatio(commitments, inc, getEffectiveStatusFn);

  return {
    month: monthKey,
    totalCommitmentsCount: commitments.length,
    openRemainingSum: openRemaining,
    paidMonthSum: paidMonth,
    overdueSum: overdueAmount,
    freeMoney,
    pressureScore,
    commitmentRatio: Math.round(commitmentRatio * 1000) / 1000,
    monthlyBurden: burden,
    recordedAt: Date.now(),
  };
}

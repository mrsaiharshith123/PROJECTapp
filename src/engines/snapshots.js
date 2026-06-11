import { totalMonthlyBurden } from "./burden.js";
import { commitmentToIncomeRatio } from "./pressureAdvanced.js";
import { computeCanonicalPressureScore } from "./pressureScore.js";

/**
 * Month-over-month deltas when a prior snapshot exists.
 * @param {object} current
 * @param {object} previous
 */
export function compareSnapshotTrend(current, previous) {
  if (!previous) return null;
  const pressureDelta = (current.pressureScore ?? 0) - (previous.pressureScore ?? 0);
  const freeMoneyDelta = (current.freeMoney ?? 0) - (previous.freeMoney ?? 0);
  const burdenDelta = (current.monthlyBurden ?? 0) - (previous.monthlyBurden ?? 0);
  const overdueDelta = (current.overdueSum ?? 0) - (previous.overdueSum ?? 0);

  return {
    pressureDelta: Math.round(pressureDelta * 10) / 10,
    freeMoneyDelta: Math.round(freeMoneyDelta),
    burdenDelta: Math.round(burdenDelta),
    overdueDelta: Math.round(overdueDelta),
    improving: pressureDelta < -2,
    worsening: pressureDelta > 2,
    trendKey:
      pressureDelta <= -5
        ? "snapshot.trend.easing"
        : pressureDelta >= 5
          ? "snapshot.trend.rising"
          : "snapshot.trend.stable",
  };
}

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
  const savingsRate = inc > 0 ? Math.round((Math.max(0, freeMoney) / inc) * 1000) / 10 : 0;

  const previous = [...(monthlySnapshots || [])]
    .filter((s) => s.month < monthKey)
    .sort((a, b) => a.month.localeCompare(b.month))
    .pop();

  const core = {
    month: monthKey,
    totalCommitmentsCount: commitments.length,
    openRemainingSum: openRemaining,
    paidMonthSum: paidMonth,
    overdueSum: overdueAmount,
    freeMoney,
    pressureScore,
    commitmentRatio: Math.round(commitmentRatio * 1000) / 1000,
    monthlyBurden: burden,
    savingsRate,
    recordedAt: Date.now(),
  };

  return {
    ...core,
    trend: compareSnapshotTrend(core, previous),
  };
}

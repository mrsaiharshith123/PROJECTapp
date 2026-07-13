import { totalMonthlyBurden } from "../burden.js";
import { lendingMonthlyOutflow } from "../survival.js";

/**
 * @param {object} input
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} input.liabilityEntries
 * @param {unknown[]} [input.commitments]
 * @param {unknown[]} [input.lendings]
 * @param {number} input.monthlyIncome
 * @param {Function} [input.getEffectiveStatus]
 * @param {Function} [input.getEffectiveLendingStatus]
 * @param {string} [input.todayStr]
 */
export function computeDebtHealth(input) {
  const income = Math.max(0, Number(input.monthlyIncome) || 0);
  const liabilities = input.liabilityEntries || [];
  const totalDebt = liabilities.reduce((s, l) => s + (Number(l.value) || 0), 0);
  const manualEmi = liabilities.reduce((s, l) => s + (Number(l.emi) || 0), 0);

  const billEmi =
    input.commitments && input.getEffectiveStatus
      ? totalMonthlyBurden(input.commitments, input.getEffectiveStatus)
      : 0;

  // Prefer the same schedule-based outflow used by the survival engine
  // (src/engines/survival.js) so "how much borrowed money do I owe monthly"
  // agrees across screens instead of debtHealth guessing a flat 5%/month
  // regardless of the loan's actual repayment schedule. Falls back to the
  // old flat-rate heuristic only when the caller can't supply the status
  // resolver (kept for backward compatibility with any other caller).
  const lendingOutflow =
    input.lendings && input.getEffectiveLendingStatus
      ? lendingMonthlyOutflow(input.lendings, input.getEffectiveLendingStatus, input.todayStr)
      : input.lendings?.reduce((/** @type {number} */ s, row) => {
          const l = /** @type {{ type?: string, remainingAmount?: number }} */ (row);
          const rem = Number(l.remainingAmount) || 0;
          if (l.type === "borrowed" && rem > 0) return s + rem * 0.05;
          return s;
        }, 0) || 0;

  const totalEmiLoad = manualEmi + billEmi + lendingOutflow;
  const debtToIncome = income > 0 ? totalDebt / (income * 12) : totalDebt > 0 ? 99 : 0;
  const emiOverloadPct = income > 0 ? (totalEmiLoad / income) * 100 : totalEmiLoad > 0 ? 100 : 0;

  const highRiskDebt = liabilities.filter(
    (l) => (Number(l.interestRate) || 0) > 18 || l.categoryId === "credit_card" || l.categoryId === "bnpl"
  );
  const interestBurden = liabilities.reduce(
    (s, l) => s + ((Number(l.value) || 0) * (Number(l.interestRate) || 0)) / 100 / 12,
    0
  );

  const monthsToDebtFree =
    totalEmiLoad > 0 ? Math.ceil(totalDebt / totalEmiLoad) : totalDebt > 0 ? null : 0;

  /** @type {'low' | 'moderate' | 'high' | 'critical'} */
  let pressureLevel;
  if (emiOverloadPct >= 55 || debtToIncome > 5) pressureLevel = "critical";
  else if (emiOverloadPct >= 40 || debtToIncome > 3) pressureLevel = "high";
  else if (emiOverloadPct >= 25) pressureLevel = "moderate";
  else pressureLevel = "low";

  return {
    totalDebt,
    totalEmiLoad: Math.round(totalEmiLoad),
    debtToIncome: Math.round(debtToIncome * 100) / 100,
    emiOverloadPct: Math.round(emiOverloadPct),
    pressureLevel,
    highRiskDebtCount: highRiskDebt.length,
    interestBurdenMonthly: Math.round(interestBurden),
    monthsToDebtFree,
    recoverySpeed:
      monthsToDebtFree != null && monthsToDebtFree <= 24
        ? "fast"
        : monthsToDebtFree != null && monthsToDebtFree <= 60
          ? "steady"
          : "slow",
    insightKeys: buildDebtInsightKeys({
      emiOverloadPct,
      monthsToDebtFree,
      highRiskCount: highRiskDebt.length,
    }),
  };
}

function buildDebtInsightKeys({ emiOverloadPct, monthsToDebtFree, highRiskCount }) {
  /** @type {{ key: string, params?: Record<string, string|number> }[]} */
  const keys = [];
  if (emiOverloadPct > 40) keys.push({ key: "netWorth.insight.debtPressureRising", params: { pct: emiOverloadPct } });
  if (monthsToDebtFree != null && monthsToDebtFree > 0 && monthsToDebtFree <= 36) {
    const years = Math.floor(monthsToDebtFree / 12);
    const months = monthsToDebtFree % 12;
    keys.push({
      key: "netWorth.insight.debtFreeTimeline",
      params: { years, months },
    });
  }
  if (highRiskCount > 0) keys.push({ key: "netWorth.insight.highRiskDebt", params: { count: highRiskCount } });
  return keys;
}

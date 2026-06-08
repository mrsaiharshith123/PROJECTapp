import { totalMonthlyBurden } from "../burden.js";
import { freeMoneyAfterBurden } from "../pressureScore.js";

/**
 * Cash flow intelligence for net worth context.
 */
export function computeCashFlowIntel(input) {
  const income = Math.max(0, Number(input.monthlyIncome) || 0);
  const getStatus = input.getEffectiveStatus;
  const commitments = input.commitments || [];
  const lendings = input.lendings || [];

  const burden = getStatus ? totalMonthlyBurden(commitments, getStatus) : 0;
  const cash = getStatus
    ? freeMoneyAfterBurden(commitments, income, getStatus, {
        lendings,
        getEffectiveLendingStatus: input.getEffectiveLendingStatus,
        todayStr: input.todayStr,
      })
    : { monthlyBurden: burden, freeMoney: income - burden };

  const leftover = Math.max(0, cash.freeMoney);
  const savingsRate = income > 0 ? (leftover / income) * 100 : 0;
  const breathingRoom = income > 0 ? Math.round((leftover / income) * 100) : 0;

  /** @type {'calm' | 'tight' | 'strained'} */
  let pressureLevel;
  if (breathingRoom >= 25) pressureLevel = "calm";
  else if (breathingRoom >= 10) pressureLevel = "tight";
  else pressureLevel = "strained";

  return {
    monthlyIncome: income,
    monthlyObligations: cash.monthlyBurden,
    leftoverCash: leftover,
    savingsRate: Math.round(savingsRate),
    breathingRoomScore: breathingRoom,
    pressureLevel,
    pressureKey: `netWorth.cashFlow.pressure.${pressureLevel}`,
    flexibilityEstimate: Math.round(leftover * 0.7),
  };
}

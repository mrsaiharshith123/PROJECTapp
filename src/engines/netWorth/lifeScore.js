/**
 * Financial Life Position Score — holistic 0–100 score.
 * @param {object} input
 */
export function computeFinancialLifeScore(input) {
  const {
    liquidity,
    debtHealth,
    savingsStreakMonths = 0,
    monthlySavingsRate = 0,
    obligationPressure = 50,
    survivabilityMonths = 0,
    investmentHabitScore = 0,
  } = input;

  let score = 50;

  // Liquidity & flexibility (25 pts)
  score += Math.min(15, (liquidity?.flexibilityScore || 0) * 0.15);
  score += Math.min(10, survivabilityMonths * 1.5);

  // Debt load (25 pts)
  const emiPct = debtHealth?.emiOverloadPct ?? 50;
  score += Math.max(-20, 15 - emiPct * 0.3);
  if (debtHealth?.pressureLevel === "low") score += 10;
  else if (debtHealth?.pressureLevel === "critical") score -= 15;

  // Savings & consistency (20 pts)
  score += Math.min(12, monthlySavingsRate * 0.4);
  score += Math.min(8, savingsStreakMonths * 1.5);

  // Pressure & stability (15 pts)
  score += Math.max(-10, 10 - obligationPressure * 0.15);

  // Investment habits (15 pts)
  score += Math.min(15, investmentHabitScore);

  score = Math.max(0, Math.min(100, Math.round(score)));

  /** @type {'thriving' | 'stable' | 'building' | 'strained' | 'at-risk'} */
  let band;
  if (score >= 82) band = "thriving";
  else if (score >= 68) band = "stable";
  else if (score >= 52) band = "building";
  else if (score >= 35) band = "strained";
  else band = "at-risk";

  return {
    score,
    band,
    labelKey: `netWorth.lifeScore.band.${band}`,
    breakdown: {
      liquidity: Math.round(Math.min(25, (liquidity?.flexibilityScore || 0) * 0.25)),
      debt: Math.round(Math.max(0, 25 - emiPct * 0.25)),
      savings: Math.round(Math.min(20, monthlySavingsRate * 0.2 + savingsStreakMonths)),
      pressure: Math.round(Math.max(0, 15 - obligationPressure * 0.1)),
      investments: Math.round(Math.min(15, investmentHabitScore)),
    },
    actionKeys: buildActionKeys(band, debtHealth, liquidity),
  };
}

function buildActionKeys(band, debtHealth, liquidity) {
  /** @type {string[]} */
  const keys = [];
  if (band === "at-risk" || band === "strained") keys.push("netWorth.action.reducePressure");
  if (debtHealth?.highRiskDebtCount > 0) keys.push("netWorth.action.tackleHighInterest");
  if (liquidity?.survivalMonths < 3) keys.push("netWorth.action.buildEmergency");
  if (band === "thriving" || band === "stable") keys.push("netWorth.action.maintainStreak");
  return keys.slice(0, 3);
}

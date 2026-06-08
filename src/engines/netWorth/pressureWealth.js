/**
 * Compares wealth growth against obligation pressure — key differentiator.
 */
export function computePressureVsWealth(input) {
  const {
    netWorth,
    liquidNetWorth,
    monthlyGrowthPct = null,
    monthlyObligations,
    monthlyIncome,
    totalDebt,
    flexibilityScore,
  } = input;

  const income = Math.max(0, Number(monthlyIncome) || 0);
  const obligations = Math.max(0, Number(monthlyObligations) || 0);
  const obligationIntensity = income > 0 ? (obligations / income) * 100 : obligations > 0 ? 100 : 0;
  const wealthToDebt = totalDebt > 0 ? netWorth / totalDebt : netWorth > 0 ? 99 : 0;
  const liquidityGap = netWorth > 0 ? ((netWorth - liquidNetWorth) / netWorth) * 100 : 0;

  const growingWealth = monthlyGrowthPct != null && monthlyGrowthPct > 0;
  const highPressure = obligationIntensity > 45;
  const weakLiquidity = liquidNetWorth < netWorth * 0.3;

  /** @type {'aligned' | 'growth-under-pressure' | 'wealth-trapped' | 'recovery'} */
  let posture;
  if (netWorth <= 0 && totalDebt > 0) posture = "recovery";
  else if (growingWealth && !highPressure) posture = "aligned";
  else if (growingWealth && highPressure) posture = "growth-under-pressure";
  else if (netWorth > 0 && weakLiquidity) posture = "wealth-trapped";
  else posture = "aligned";

  /** @type {{ key: string, params?: Record<string, string|number> }[]} */
  const narrativeKeys = [];
  if (posture === "growth-under-pressure") {
    narrativeKeys.push({ key: "netWorth.pressure.growthUnderPressure" });
  }
  if (posture === "wealth-trapped") {
    narrativeKeys.push({ key: "netWorth.pressure.wealthTrapped", params: { gap: Math.round(liquidityGap) } });
  }
  if (totalDebt > 0 && netWorth > 0 && wealthToDebt < 1.2) {
    narrativeKeys.push({ key: "netWorth.pressure.offsetByDebt" });
  }
  if (flexibilityScore < 45 && netWorth > income * 6) {
    narrativeKeys.push({ key: "netWorth.pressure.highNetLowFlex" });
  }

  return {
    posture,
    postureKey: `netWorth.posture.${posture}`,
    obligationIntensity: Math.round(obligationIntensity),
    wealthToDebtRatio: Math.round(wealthToDebt * 100) / 100,
    liquidityGapPct: Math.round(liquidityGap),
    breathingRoom: Math.max(0, income - obligations),
    narrativeKeys,
  };
}

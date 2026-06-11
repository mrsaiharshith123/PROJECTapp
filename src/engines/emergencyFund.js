/**
 * Recommended emergency reserve (months of burn × dependents factor).
 */
export function computeEmergencyFundIntel({
  monthlyBurden,
  liquidSavings,
  dependents = 0,
  pressureScore = 50,
  targetMonthsOverride = null,
}) {
  const burn = Math.max(0, monthlyBurden);
  const baseMonths = pressureScore >= 70 ? 6 : pressureScore >= 50 ? 5 : 4;
  const depFactor = 1 + Math.min(0.5, Math.max(0, dependents) * 0.1);
  const recommendedMonths =
    targetMonthsOverride != null && targetMonthsOverride > 0
      ? Number(targetMonthsOverride)
      : baseMonths * depFactor;
  const recommended = Math.round(burn * recommendedMonths);
  const current = Math.max(0, liquidSavings);
  const gap = Math.max(0, recommended - current);
  const progress = recommended > 0 ? Math.min(1, current / recommended) : 1;
  const monthsOfCover = burn > 0 ? Math.round((current / burn) * 10) / 10 : null;
  const suggestedMonthlyTopUp = gap > 0 ? Math.ceil(gap / 18) : 0;
  const monthsToTarget =
    suggestedMonthlyTopUp > 0 ? Math.ceil(gap / suggestedMonthlyTopUp) : gap === 0 ? 0 : null;

  let tier = "on_track";
  if (progress < 0.35) tier = "critical";
  else if (progress < 0.6) tier = "building";
  else if (progress < 0.9) tier = "almost";

  /** @type {{ key: string, params?: Record<string, string | number> }[]} */
  const insightKeys = [];
  if (burn > 0 && monthsOfCover != null && monthsOfCover < 2) {
    insightKeys.push({ key: "emergency.insight.lowCover", params: { months: monthsOfCover } });
  }
  if (gap > 0 && suggestedMonthlyTopUp > 0) {
    insightKeys.push({
      key: "emergency.insight.topUp",
      params: { amount: suggestedMonthlyTopUp.toLocaleString("en-IN"), months: monthsToTarget },
    });
  }
  if (tier === "on_track" && monthsOfCover != null && monthsOfCover >= recommendedMonths) {
    insightKeys.push({ key: "emergency.insight.funded", params: { months: monthsOfCover } });
  }

  return {
    recommended,
    recommendedMonths: Math.round(recommendedMonths * 10) / 10,
    current,
    gap,
    progressPercent: Math.round(progress * 100),
    monthsOfCover,
    suggestedMonthlyTopUp,
    monthsToTarget,
    tier,
    messageKey: `emergency.tier.${tier}`,
    insightKeys,
  };
}

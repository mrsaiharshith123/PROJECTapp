/**
 * Recommended emergency reserve (months of burn × dependents factor).
 */
export function computeEmergencyFundIntel({
  monthlyBurden,
  liquidSavings,
  dependents = 0,
  pressureScore = 50,
}) {
  const burn = Math.max(0, monthlyBurden);
  const baseMonths = pressureScore >= 70 ? 6 : pressureScore >= 50 ? 5 : 4;
  const depFactor = 1 + Math.min(0.5, Math.max(0, dependents) * 0.1);
  const recommendedMonths = baseMonths * depFactor;
  const recommended = Math.round(burn * recommendedMonths);
  const current = Math.max(0, liquidSavings);
  const gap = Math.max(0, recommended - current);
  const progress = recommended > 0 ? Math.min(1, current / recommended) : 1;

  let tier = "on_track";
  if (progress < 0.35) tier = "critical";
  else if (progress < 0.6) tier = "building";
  else if (progress < 0.9) tier = "almost";

  const messages = {
    critical: "Emergency reserve is well below recommended for your obligations.",
    building: "You are building reserve — keep going toward 3–6 months of expenses.",
    almost: "You are close to a healthy emergency buffer.",
    on_track: "Emergency reserve looks healthy for current pressure.",
  };

  return {
    recommended,
    recommendedMonths: Math.round(recommendedMonths * 10) / 10,
    current,
    gap,
    progressPercent: Math.round(progress * 100),
    tier,
    message: messages[tier],
  };
}

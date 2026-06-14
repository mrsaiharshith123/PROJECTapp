import { computeHouseholdMetrics } from "./householdEntity.js";

/**
 * Unified household stability index (0–100) — one score for the family command center.
 * @param {object} input
 */
export function computeFamilyStabilityScore({
  settings,
  commitments,
  getEffectiveStatus,
  pressureScore = null,
  emergencyPct = null,
  survivalMonths = null,
  overdueCount = 0,
}) {
  const household = computeHouseholdMetrics({ settings, commitments, getEffectiveStatus });
  const income = household.combinedIncome;
  const primary = Math.max(0, Number(settings?.monthlyIncome) || 0);
  const incomeConcentration = income > 0 ? primary / income : 1;

  let score = pressureScore != null ? pressureScore : 70;
  if (emergencyPct != null) {
    if (emergencyPct >= 80) score += 8;
    else if (emergencyPct >= 50) score += 4;
    else if (emergencyPct < 25) score -= 10;
  }
  if (survivalMonths != null) {
    if (survivalMonths >= 6) score += 6;
    else if (survivalMonths < 3) score -= 12;
    else if (survivalMonths < 4) score -= 6;
  }
  if (household.dependencyRatio >= 0.5) score -= 8;
  else if (household.dependencyRatio >= 0.35) score -= 4;
  if (incomeConcentration > 0.85 && household.memberCount > 2) score -= 10;
  if (overdueCount > 0) score -= Math.min(15, overdueCount * 5);
  if (household.combinedFreeCash < 0) score -= 12;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const tier =
    score >= 72 ? "thriving" : score >= 55 ? "steady" : score >= 38 ? "watch" : "fragile";

  return {
    score,
    tier,
    incomeConcentrationPct: income > 0 ? Math.round(incomeConcentration * 100) : null,
    dependencyRatio: household.dependencyRatio,
    burdenRatio: household.burdenRatio,
    combinedFreeCash: household.combinedFreeCash,
  };
}

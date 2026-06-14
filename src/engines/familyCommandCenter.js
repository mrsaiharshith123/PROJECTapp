import { computeFamilyPressure } from "./modeFamily.js";
import { computeHouseholdMetrics, computeFamilyEmergencyTarget } from "./householdEntity.js";
import { computeFamilyStabilityScore } from "./familyStabilityScore.js";
import { analyzeFamilyDependency } from "./familyDependency.js";
import { buildFamilyContributionMemory } from "./familyContribution.js";
import { buildFamilyPressureForecast } from "./familyPressureForecast.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";

/**
 * Family Financial Operating System — orchestrates household intelligence for UI.
 */
export function buildFamilyCommandCenter({
  settings,
  commitments,
  goals = [],
  getEffectiveStatus,
  todayStr,
  pressureScore = null,
  survivalMonths = null,
  overdueCount = 0,
  aheadPlan = null,
  pressureIntel = null,
}) {
  const income = combinedMonthlyIncome(settings);
  const family = computeFamilyPressure(commitments, income, getEffectiveStatus, settings?.dependents || 0);
  const household = computeHouseholdMetrics({ settings, commitments, getEffectiveStatus, todayStr });
  const emergencyTarget = computeFamilyEmergencyTarget(settings, commitments, getEffectiveStatus);
  const liquid = Math.max(0, Number(settings?.liquidSavings) || 0);
  const emergencyPct =
    emergencyTarget.targetAmount > 0
      ? Math.min(100, Math.round((liquid / emergencyTarget.targetAmount) * 100))
      : null;

  const stability = computeFamilyStabilityScore({
    settings,
    commitments,
    getEffectiveStatus,
    pressureScore: family.familyPressureScore ?? pressureScore,
    emergencyPct,
    survivalMonths,
    overdueCount,
  });

  const dependency = analyzeFamilyDependency({ settings, commitments, getEffectiveStatus });
  const contribution = buildFamilyContributionMemory(commitments, getEffectiveStatus, todayStr);
  const forecast = buildFamilyPressureForecast({
    commitments,
    todayStr,
    getEffectiveStatus,
    aheadPlan,
    pressureIntel,
    emergencyPct,
  });

  const sharedGoals = (goals || []).filter((g) => g.status !== "completed").slice(0, 4);

  const insights = [
    ...family.insights,
    ...dependency.insights,
    ...forecast.insights,
    ...contribution.memories,
  ].slice(0, 8);

  return {
    stability,
    household,
    family,
    dependency,
    contribution,
    forecast,
    emergencyTarget,
    emergencyPct,
    sharedGoals,
    insights,
    income,
    obligationsOpen: household.combinedBurden,
    freeCash: household.combinedFreeCash,
  };
}

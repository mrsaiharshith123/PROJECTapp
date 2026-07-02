import { useMemo } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";
import { useNetWorth } from "../context/NetWorthContext.jsx";
import { useCommitIntel } from "./useCommitIntel.js";
import { buildSurvivalContext, lendingMonthlyOutflow } from "../engines/survival.js";
import { rankStressContributors } from "../engines/stressContributors.js";
import { detectLifestyleInflation } from "../engines/lifestyleInflation.js";
import { computeEmergencyFundIntel } from "../engines/emergencyFund.js";
import { resolveEmergencyLiquidPool } from "../utils/emergencyLiquid.js";
import { freeMoneyAfterBurden } from "../engines/pressureScore.js";
import { mergeExtendedInsights } from "../engines/commitmentInsights.js";
import { buildStabilityHealthNarrative } from "../engines/stabilityNarrative.js";
import { buildPressureIntelligence } from "../engines/pressureIntelligence.js";
import { buildStabilityAheadPlan } from "../engines/stabilityPlan.js";
import { resolveUserMode, getExperienceMode, hasPowerFeatures } from "../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { applyDevOverrideToStabilityIntel, useDevOverrideTick } from "../utils/devOverride.js";

/** Mode-specific financial stability intelligence. */
export function useStabilityIntel() {
  const ctx = usePerovo();
  const { entries: wealthEntries } = useNetWorth();
  const intel = useCommitIntel();
  const baseMode = resolveUserMode(ctx.settings);
  const experienceMode = getExperienceMode(ctx.settings);
  const devTick = useDevOverrideTick();

  return useMemo(() => {
    const income = combinedMonthlyIncome(ctx.settings);
    const cash = freeMoneyAfterBurden(ctx.commitments, income, ctx.getEffectiveStatus, {
      lendings: ctx.lendings,
      getEffectiveLendingStatus: ctx.getEffectiveLendingStatus,
      todayStr: ctx.todayStr,
    });
    const burdenRatio = income > 0 ? cash.monthlyBurden / income : 0;

    const survival = buildSurvivalContext(
      ctx.commitments,
      ctx.lendings,
      ctx.settings,
      ctx.getEffectiveStatus,
      ctx.getEffectiveLendingStatus,
      ctx.todayStr,
      cash,
    );
    const stress = rankStressContributors(ctx.commitments, ctx.getEffectiveStatus);
    const lifestyle = detectLifestyleInflation(ctx.commitments, ctx.getEffectiveStatus);
    const liquidPool = resolveEmergencyLiquidPool(ctx.settings, wealthEntries);
    const emergency = computeEmergencyFundIntel({
      monthlyBurden: cash.monthlyBurden,
      liquidSavings: liquidPool,
      dependents: ctx.settings.dependents,
      pressureScore: intel.stability.score,
    });

    const overdueCount = ctx.commitments.filter((c) => ctx.getEffectiveStatus(c) === "overdue").length;

    const ahead =
      baseMode === "salaried" || hasPowerFeatures(ctx.settings)
        ? buildStabilityAheadPlan({
            commitments: ctx.commitments,
            lendings: ctx.lendings,
            goals: ctx.goals,
            settings: ctx.settings,
            getEffectiveStatus: ctx.getEffectiveStatus,
            getEffectiveLendingStatus: ctx.getEffectiveLendingStatus,
            todayStr: ctx.todayStr,
            mode: experienceMode,
          })
        : null;

    const healthNarrative = buildStabilityHealthNarrative({
      mode: "salaried",
      health: intel.health,
      stability: intel.stability,
      survival,
      emergency,
      lifestyle,
      overdueCount,
      commitments: ctx.commitments,
      lendings: ctx.lendings,
    });

    const pressureIntel = buildPressureIntelligence({
      snapshots: ctx.monthlySnapshots,
      commitments: ctx.commitments,
      todayStr: ctx.todayStr,
      score: intel.stability.score,
      stressTop: stress.top,
    });

    const extraInsights = [
      ...lifestyle.insights,
      ...(ahead?.headlines || []).map((h) => ({ id: h.id, tone: h.tone, key: h.key, params: h.params })),
      ...survival.warnings.map((w, i) => ({
        id: `survival-warn-${i}`,
        tone: "warning",
        text: String(w),
      })),
    ].filter(Boolean);

    const stabilityInsights = mergeExtendedInsights(intel.insights, extraInsights);

    const stable = {
      mode: experienceMode,
      income,
      overdueCount,
      burdenRatio,
      survival,
      stress,
      lifestyle,
      emergency,
      healthNarrative,
      pressureIntel,
      ahead,
      goalBalance: ahead?.goalBalance || null,
      goalCapacity: ahead?.goalCapacity || [],
      lendingOutflow: lendingMonthlyOutflow(ctx.lendings, ctx.getEffectiveLendingStatus, ctx.todayStr),
      stabilityInsights,
    };
    return applyDevOverrideToStabilityIntel(stable);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- broad ctx fields drive one stability snapshot
  }, [
    baseMode,
    experienceMode,
    ctx.commitments,
    ctx.lendings,
    ctx.goals,
    ctx.settings,
    ctx.monthlySnapshots,
    ctx.todayStr,
    ctx.getEffectiveStatus,
    ctx.getEffectiveLendingStatus,
    intel,
    wealthEntries,
    devTick,
  ]);
}

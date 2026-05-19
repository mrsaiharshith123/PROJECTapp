import { useMemo } from "react";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { useCommitIntel } from "./useCommitIntel.js";
import { buildSurvivalContext, lendingMonthlyOutflow } from "../engines/survival.js";
import { rankStressContributors } from "../engines/stressContributors.js";
import { detectLifestyleInflation } from "../engines/lifestyleInflation.js";
import { computeEmergencyFundIntel } from "../engines/emergencyFund.js";
import { computeBusinessCashflow } from "../engines/modeBusiness.js";
import { computeFreelancerVolatility, clientDependencyInsight } from "../engines/modeFreelancer.js";
import { computeFamilyPressure } from "../engines/modeFamily.js";
import { computeStudentBudget } from "../engines/modeStudent.js";
import { freeMoneyAfterBurden } from "../engines/pressureScore.js";
import { mergeExtendedInsights } from "../engines/insightsExtended.js";
import { buildStabilityHealthNarrative } from "../engines/stabilityNarrative.js";
import { buildPressureIntelligence } from "../engines/pressureIntelligence.js";
import { buildStabilityAheadPlan } from "../engines/stabilityPlan.js";
import { resolveUserMode, getExperienceMode, isSalariedFamily, hasPowerFeatures } from "../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { householdPayerInsight } from "../engines/householdPayer.js";

/** Mode-specific financial stability intelligence (salaried, family, etc.). */
export function useStabilityIntel() {
  const ctx = useCommitTrack();
  const intel = useCommitIntel();
  const baseMode = resolveUserMode(ctx.settings);
  const experienceMode = getExperienceMode(ctx.settings);

  return useMemo(() => {
    const income = combinedMonthlyIncome(ctx.settings);
    const cash = freeMoneyAfterBurden(ctx.commitments, income, ctx.getEffectiveStatus);
    const burdenRatio = income > 0 ? cash.monthlyBurden / income : 0;

    const survival = buildSurvivalContext(
      ctx.commitments,
      ctx.lendings,
      ctx.settings,
      ctx.getEffectiveStatus,
      ctx.getEffectiveLendingStatus,
      ctx.todayStr,
      cash
    );
    const stress = rankStressContributors(ctx.commitments, ctx.getEffectiveStatus);
    const lifestyle = detectLifestyleInflation(ctx.commitments, ctx.getEffectiveStatus);
    const emergency = computeEmergencyFundIntel({
      monthlyBurden: cash.monthlyBurden,
      liquidSavings: ctx.settings.liquidSavings,
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
      mode: experienceMode === "family" ? "family" : "salaried",
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
      ...(ahead?.headlines || []),
      ...survival.warnings.map((text, i) => ({
        id: `survival-warn-${i}`,
        tone: "warning",
        text,
      })),
    ].filter(Boolean);

    let modeData = {};
    if (baseMode === "business") {
      modeData = {
        business: computeBusinessCashflow(
          ctx.commitments,
          ctx.lendings,
          ctx.getEffectiveStatus,
          ctx.getEffectiveLendingStatus,
          ctx.todayStr,
          ctx.businessInvoices
        ),
      };
      extraInsights.push(...(modeData.business.insights || []));
    } else if (baseMode === "freelancer") {
      const vol = computeFreelancerVolatility(ctx.monthlySnapshots, income);
      const client = clientDependencyInsight(ctx.lendings);
      modeData = { freelancer: vol };
      extraInsights.push(...(vol.insights || []));
      if (client) extraInsights.push(client);
    } else if (experienceMode === "family") {
      modeData = {
        family: computeFamilyPressure(
          ctx.commitments,
          income,
          ctx.getEffectiveStatus,
          ctx.settings.dependents
        ),
      };
      extraInsights.push(...(modeData.family.insights || []));
      const payerIns = householdPayerInsight(
        ctx.commitments,
        ctx.getEffectiveStatus,
        Math.max(0, Number(ctx.settings.secondaryMonthlyIncome) || 0)
      );
      if (payerIns) extraInsights.push(payerIns);
    } else if (baseMode === "student") {
      modeData = {
        student: computeStudentBudget(
          ctx.commitments,
          ctx.settings,
          ctx.getEffectiveStatus,
          ctx.todayStr,
          intel
        ),
      };
      extraInsights.push(...(modeData.student.insights || []));
    }

    const stabilityInsights = mergeExtendedInsights(intel.insights, extraInsights);

    return {
      mode: experienceMode,
      income,
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
      family: modeData.family || null,
      lendingOutflow: lendingMonthlyOutflow(ctx.lendings, ctx.getEffectiveLendingStatus, ctx.todayStr),
      stabilityInsights,
      ...modeData,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- broad ctx fields drive one stability snapshot
  }, [
    baseMode,
    experienceMode,
    ctx.commitments,
    ctx.lendings,
    ctx.goals,
    ctx.businessInvoices,
    ctx.settings,
    ctx.monthlySnapshots,
    ctx.todayStr,
    ctx.getEffectiveStatus,
    ctx.getEffectiveLendingStatus,
    intel,
  ]);
}

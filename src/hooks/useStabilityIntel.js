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

/** Mode-specific financial stability intelligence (salaried, business, etc.). */
export function useStabilityIntel() {
  const ctx = useCommitTrack();
  const intel = useCommitIntel();
  const mode = ctx.settings.userMode || "salaried";

  return useMemo(() => {
    const income = Math.max(0, Number(ctx.settings.monthlyIncome) || 0);
    const cash = freeMoneyAfterBurden(ctx.commitments, income, ctx.getEffectiveStatus);
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
      monthlyBurden: intel.stability.monthlyBurden,
      liquidSavings: ctx.settings.liquidSavings,
      dependents: ctx.settings.dependents,
      pressureScore: intel.stability.score,
    });

    const extraInsights = [
      ...lifestyle.insights,
      ...survival.warnings.map((text, i) => ({
        id: `survival-warn-${i}`,
        tone: "warning",
        text,
      })),
    ].filter(Boolean);

    let modeData = {};
    if (mode === "business") {
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
    } else if (mode === "freelancer") {
      const vol = computeFreelancerVolatility(ctx.monthlySnapshots, income);
      const client = clientDependencyInsight(ctx.lendings);
      modeData = { freelancer: vol };
      extraInsights.push(...(vol.insights || []));
      if (client) extraInsights.push(client);
    } else if (mode === "family") {
      const fam = computeFamilyPressure(
        ctx.commitments,
        income,
        ctx.getEffectiveStatus,
        ctx.settings.dependents
      );
      modeData = { family: fam };
      extraInsights.push(...(fam.insights || []));
    } else if (mode === "student") {
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
      mode,
      survival,
      stress,
      lifestyle,
      emergency,
      lendingOutflow: lendingMonthlyOutflow(ctx.lendings, ctx.getEffectiveLendingStatus, ctx.todayStr),
      stabilityInsights,
      ...modeData,
    };
  }, [
    mode,
    ctx.commitments,
    ctx.lendings,
    ctx.businessInvoices,
    ctx.settings,
    ctx.monthlySnapshots,
    ctx.todayStr,
    ctx.getEffectiveStatus,
    ctx.getEffectiveLendingStatus,
    intel,
  ]);
}

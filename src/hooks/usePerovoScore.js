import { useMemo } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";
import { useCommitIntel } from "./useCommitIntel.js";
import { useStabilityIntel } from "./useStabilityIntel.js";
import { useNetWorthIntel } from "./useNetWorthIntel.js";
import { scoreAllBillsHealth, aggregateBillHealthScore } from "../engines/billHealth.js";
import { computePerovoScore, debtHealthToScore } from "../engines/perovoScore.js";
import { analyzeCreditCardPressure } from "../engines/stabilityPlan.js";
import { computeGoalProgress } from "../engines/goalsProgress.js";
import { commitmentToIncomeRatio } from "../engines/pressureScore.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { isActiveBill } from "../utils/billLifecycle.js";

/** Canonical Perovo Score + four pillars for Home, Profile, and Analytics heroes. */
export function usePerovoScore() {
  const ctx = usePerovo();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const nwIntel = useNetWorthIntel();

  return useMemo(() => {
    const income = combinedMonthlyIncome(ctx.settings);
    const activeBills = ctx.commitments.filter((c) =>
      isActiveBill(c, ctx.getEffectiveStatus, ctx.todayStr),
    );
    const scored = scoreAllBillsHealth(activeBills, (c) => ctx.getEffectiveStatus(c), {
      todayStr: ctx.todayStr,
    });
    const billPortfolio = aggregateBillHealthScore(scored);

    const allGoals = ctx.allGoals || [];
    const openRemaining = ctx.commitments.reduce(
      (s, c) => s + Math.max(0, Number(c.remainingAmount ?? 0)),
      0,
    );
    const ratio = commitmentToIncomeRatio(ctx.commitments, income, ctx.getEffectiveStatus);
    let onTrack = 0;
    allGoals.forEach((g) => {
      if (g.archived) return;
      const saved =
        g.type === "save_amount" || g.type === "education" || g.type === "wedding"
          ? Number(g.savedAmount) || 0
          : 0;
      const p = computeGoalProgress(g, {
        openRemainingSum: openRemaining,
        burdenRatio: ratio,
        savedAmountTowardGoal: saved,
      });
      if (p >= 0.5) onTrack += 1;
    });
    const goalsOnTrackRatio = allGoals.length ? onTrack / allGoals.length : 0.5;

    const cardPressure = analyzeCreditCardPressure(
      ctx.commitments,
      ctx.getEffectiveStatus,
      income,
    );
    const creditUtil =
      cardPressure?.utilizationPercent != null ? cardPressure.utilizationPercent : null;

    const snapshots = [...(ctx.monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
    const prevSnap = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

    const debtHealthScore = debtHealthToScore(nwIntel.debtHealth);

    let previousPillars;
    if (prevSnap?.pressureScore != null) {
      previousPillars = computePerovoScore({
        pressureScore: prevSnap.pressureScore,
        health: intel.health,
        billPortfolioScore: billPortfolio.score,
        emergencyProgressPercent: stable.emergency?.progressPercent ?? 0,
        debtHealthScore,
        creditUtilizationPercent: creditUtil,
        goalsOnTrackRatio,
      }).pillars;
      previousPillars = {
        cashflow: previousPillars.cashflow.score,
        savings: previousPillars.savings.score,
        debt: previousPillars.debt.score,
        protection: previousPillars.protection.score,
      };
    }

    const withTrends = computePerovoScore({
      pressureScore: intel.stability?.score ?? 50,
      health: intel.health,
      billPortfolioScore: billPortfolio.score,
      emergencyProgressPercent: stable.emergency?.progressPercent ?? 0,
      debtHealthScore,
      creditUtilizationPercent: creditUtil,
      goalsOnTrackRatio,
      previousPillars,
    });

    return {
      ...withTrends,
      survivalMonths: stable.survival?.survivalMonths ?? null,
      freeCash: intel.freeMoneyAfterBurden ?? 0,
    };
  }, [ctx, intel, stable, nwIntel]);
}

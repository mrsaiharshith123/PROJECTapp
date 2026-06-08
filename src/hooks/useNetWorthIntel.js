import { useMemo } from "react";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { useNetWorth } from "../context/NetWorthContext.jsx";
import { partitionWealth } from "../engines/netWorth/core.js";
import { computeLiquidityIntelligence } from "../engines/netWorth/liquidity.js";
import { computeDebtHealth } from "../engines/netWorth/debtHealth.js";
import { computeFinancialLifeScore } from "../engines/netWorth/lifeScore.js";
import { computePressureVsWealth } from "../engines/netWorth/pressureWealth.js";
import { computeCashFlowIntel } from "../engines/netWorth/cashFlow.js";
import { buildNetWorthInsights } from "../engines/netWorth/insights.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";

export function useNetWorthIntel() {
  const wealth = useNetWorth();
  const track = useCommitTrack();

  return useMemo(() => {
    const income = combinedMonthlyIncome(track.settings);
    const { liabilities } = partitionWealth(wealth.entries);
    const cashFlow = computeCashFlowIntel({
      monthlyIncome: income,
      commitments: track.commitments,
      lendings: track.lendings,
      getEffectiveStatus: track.getEffectiveStatus,
      getEffectiveLendingStatus: track.getEffectiveLendingStatus,
      todayStr: track.todayStr,
    });

    const liquidity = computeLiquidityIntelligence({
      entries: wealth.entries,
      monthlyObligations: cashFlow.monthlyObligations,
      monthlyIncome: income,
    });

    const debtHealth = computeDebtHealth({
      liabilityEntries: liabilities,
      commitments: track.commitments,
      lendings: track.lendings,
      monthlyIncome: income,
      getEffectiveStatus: track.getEffectiveStatus,
      getEffectiveLendingStatus: track.getEffectiveLendingStatus,
      todayStr: track.todayStr,
    });

    const investableAssets = wealth.core.assetAllocation
      .filter((a) => ["sip", "stocks", "mutual_fund", "gold"].includes(a.categoryId))
      .reduce((s, a) => s + a.value, 0);

    const pressure = computePressureVsWealth({
      netWorth: wealth.core.netWorth,
      liquidNetWorth: wealth.core.liquidNetWorth,
      monthlyGrowthPct: wealth.growth.monthlyPct,
      monthlyObligations: cashFlow.monthlyObligations,
      monthlyIncome: income,
      totalDebt: debtHealth.totalDebt,
      flexibilityScore: liquidity.flexibilityScore,
    });

    const lifeScore = computeFinancialLifeScore({
      liquidity,
      debtHealth,
      savingsStreakMonths: wealth.savingsStreakMonths,
      monthlySavingsRate: cashFlow.savingsRate,
      obligationPressure: pressure.obligationIntensity,
      survivabilityMonths: liquidity.survivalMonths,
      investmentHabitScore: investableAssets > income * 3 ? 12 : investableAssets > income ? 8 : 4,
    });

    const prevSnap = wealth.snapshots.length > 1 ? wealth.snapshots[wealth.snapshots.length - 2] : null;
    const liabilitiesGrowingFaster =
      prevSnap != null &&
      wealth.core.totalLiabilities > prevSnap.totalLiabilities &&
      wealth.core.totalAssets <= (prevSnap.totalAssets || 0);

    const insights = buildNetWorthInsights({
      savingsStreakMonths: wealth.savingsStreakMonths,
      monthlyGrowthPct: wealth.growth.monthlyPct,
      liabilitiesGrowingFaster,
      emergencyBelowRecommended: liquidity.survivalMonths < 3,
      flexibilityImproved: liquidity.flexibilityScore >= 60,
      debtHealth,
      lifeScore,
      liquidity,
      pressure,
    });

    /** @type {'positive' | 'neutral' | 'caution' | 'recovery'} */
    let emotionalStatus;
    if (wealth.core.netWorth < 0) emotionalStatus = "recovery";
    else if (lifeScore.band === "thriving" || lifeScore.band === "stable") emotionalStatus = "positive";
    else if (lifeScore.band === "strained" || lifeScore.band === "at-risk") emotionalStatus = "caution";
    else emotionalStatus = "neutral";

    return {
      ...wealth,
      cashFlow,
      liquidity,
      debtHealth,
      lifeScore,
      pressure,
      insights,
      emotionalStatus,
      emotionalStatusKey: `netWorth.status.${emotionalStatus}`,
      investableAssets,
      simulationBase: {
        netWorth: wealth.core.netWorth,
        liquidNetWorth: wealth.core.liquidNetWorth,
        totalDebt: debtHealth.totalDebt,
        monthlyIncome: income,
        monthlyObligations: cashFlow.monthlyObligations,
        investableAssets,
      },
    };
  }, [wealth, track]);
}

import { useMemo } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";
import { generateCommitmentInsights } from "../engines/intelligence.js";
import {
  overlappingDueDatesInsight,
  forecastCrunchInsight,
  subscriptionYearlyCostInsight,
  emiBurdenPercentInsight,
  mergeExtendedInsights,
} from "../engines/insightsExtended.js";
import { yearlyBurdenEstimate, commitmentToIncomeRatio } from "../engines/pressureAdvanced.js";
import {
  computePressureAnalysis,
  pressureScoreLabel,
  pressureScoreTone,
  freeMoneyAfterBurden,
} from "../engines/pressureScore.js";
import { computeFinancialHealthScore } from "../engines/financialHealth.js";
import { rankPayoffOrder, topPayoffRecommendation } from "../engines/payoffPriority.js";
import { buildNotificationFeed, unreadCount } from "../engines/notifications.js";
import { forecastInsights } from "../engines/forecast.js";
import { subscriptionLeakReport } from "../engines/subscriptionLeak.js";
import { getEffectiveLendingStatus } from "../utils/lendingStatus.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import {
  transactionInsightsForMerge,
  buildTransactionLifeFeed,
  buildTransactionInsights,
} from "../services/transactions/index.js";
import { computeCurrentMonthSummary } from "../utils/monthPaymentSummary.js";
import { totalPaidOnPayments } from "../utils/commitmentPayments.js";
import { memoIntel, buildIntelCacheKey } from "../utils/intelMemo.js";
import { applyDevOverrideToCommitIntel, useDevOverrideTick } from "../utils/devOverride.js";
import { useCommitIntelFromContext } from "./intelContext.js";

export function useCommitIntelInternal() {
  const {
    commitments,
    lendings,
    settings,
    monthlySnapshots,
    dailySpends,
    todayStr,
    getEffectiveStatus,
    supplementalNotifications,
  } = usePerovo();

  const devTick = useDevOverrideTick();

  const rawIntel = useMemo(() => {
    const openSum = commitments.reduce((s, c) => s + (Number(c.remainingAmount) || 0), 0);
    const paymentsLen = commitments.reduce((s, c) => s + (c.payments?.length ?? 0), 0);
    const paymentsTotal = commitments.reduce(
      (s, c) => s + totalPaidOnPayments(c.payments),
      0,
    );
    const cacheKey = buildIntelCacheKey([
      commitments.length,
      openSum,
      paymentsLen,
      Math.round(paymentsTotal),
      lendings.length,
      dailySpends?.length,
      todayStr,
      settings.monthlyIncome,
      settings.liquidSavings,
      monthlySnapshots?.length,
      settings.readNotificationIds?.length,
    ]);

    const intel = memoIntel(cacheKey, () => {
    const income = combinedMonthlyIncome(settings);
    const burdenRatio = commitmentToIncomeRatio(commitments, income, getEffectiveStatus);
    const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus, {
      lendings,
      getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
      todayStr,
    });
    const openRemaining = cash.openRemaining;

    const baseInsights = generateCommitmentInsights({
      commitments,
      snapshots: monthlySnapshots,
      income,
      getEffectiveStatus,
    });
    const extended = [
      overlappingDueDatesInsight(
        commitments,
        lendings,
        todayStr,
        getEffectiveStatus,
        (l) => getEffectiveLendingStatus(l, todayStr)
      ),
      forecastCrunchInsight(commitments, income, getEffectiveStatus, todayStr, {
        lendings,
        getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
      }),
      subscriptionYearlyCostInsight(commitments, getEffectiveStatus),
      emiBurdenPercentInsight(commitments, income, getEffectiveStatus),
    ].filter(Boolean);

    const monthSummary = computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income, {
      dailySpends: dailySpends || [],
      lendings,
      getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
      profileId: settings.activeProfileId || "default",
    });
    const txnInput = {
      commitments,
      lendings,
      settings,
      dailySpends: dailySpends || [],
      todayStr,
      getEffectiveStatus,
      getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
      burdenRatio,
      freeCash: cash.freeMoney,
      monthSummary,
    };
    const transactionInsights = transactionInsightsForMerge(txnInput);
    const transactionFeed = buildTransactionLifeFeed(txnInput, 4);
    const transactionRhythmNote = buildTransactionInsights(txnInput).rhythmNote;

    const insights = mergeExtendedInsights(baseInsights, [...extended, ...transactionInsights]);

    const pressureAnalysis = computePressureAnalysis({
      commitments,
      income,
      getEffectiveStatus: (c) => getEffectiveStatus(c),
      monthlySnapshots,
      lendings,
      getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
      todayStr,
      dailySpends: dailySpends || [],
    });
    const score = pressureAnalysis.score;
    const stabilityMeta = pressureScoreLabel(score);

    const sortedSnaps = [...(monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
    const previousPressureScore =
      sortedSnaps.length >= 2 ? sortedSnaps[sortedSnaps.length - 2].pressureScore : null;

    const health = computeFinancialHealthScore({
      commitments,
      lendings,
      income,
      getEffectiveStatus,
      openRemaining,
      freeMoneyAfterBurden: cash.freeMoney,
      liquidSavings: settings.liquidSavings,
      monthlySnapshots,
    });

    const ranked = rankPayoffOrder(commitments, getEffectiveStatus, todayStr);
    const payoffRec = topPayoffRecommendation(ranked);

    const feed = buildNotificationFeed({
      commitments,
      lendings,
      settings,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      todayStr,
      insights,
      readIds: settings.readNotificationIds,
      monthlySnapshots,
      previousPressureScore,
    });
    const notifications = [...(supplementalNotifications || []), ...feed].sort((a, b) => {
      const order = { critical: 0, high: 1, normal: 2, low: 3 };
      const d = (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
      if (d !== 0) return d;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const forecast = forecastInsights(commitments, todayStr);
    const subscriptionLeak = subscriptionLeakReport(commitments, getEffectiveStatus, todayStr);
    const yearlyBurden = yearlyBurdenEstimate(commitments, getEffectiveStatus);

    const stability = {
      score,
      level: stabilityMeta.level,
      label: stabilityMeta.label,
      tone: stabilityMeta.tone || pressureScoreTone(score),
      committedPercent: cash.committedPercent,
      monthlyBurden: cash.monthlyBurden,
      freeMoney: cash.freeMoney,
      pressureAnalysis,
    };

    return {
      income,
      openRemaining,
      freeMoneyAfterBurden: cash.freeMoney,
      burdenRatio,
      insights,
      stability,
      pressureAnalysis,
      health,
      rankedPayoffs: ranked,
      payoffRec,
      notifications,
      notificationUnread: unreadCount(notifications),
      forecast,
      subscriptionLeak,
      yearlyBurden,
      transactionFeed,
      transactionRhythmNote,
    };
    });
    return intel;
  }, [
    commitments,
    lendings,
    settings,
    supplementalNotifications,
    monthlySnapshots,
    dailySpends,
    todayStr,
    getEffectiveStatus,
  ]);

  // devTick intentionally invalidates dev override layer when panel toggles
  // eslint-disable-next-line react-hooks/exhaustive-deps -- devTick is not read inside memo; it forces recomputation
  return useMemo(() => applyDevOverrideToCommitIntel(rawIntel), [rawIntel, devTick]);
}

export function useCommitIntel() {
  const cached = useCommitIntelFromContext();
  if (cached == null) {
    throw new Error("useCommitIntel must be used within IntelProvider");
  }
  return cached;
}

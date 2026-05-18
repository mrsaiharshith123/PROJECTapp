import { useMemo } from "react";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
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
  computeCanonicalPressureScore,
  pressureScoreLabel,
  pressureScoreBadgeClass,
  freeMoneyAfterBurden,
} from "../engines/pressureScore.js";
import { computeFinancialHealthScore } from "../engines/financialHealth.js";
import { rankPayoffOrder, topPayoffRecommendation } from "../engines/payoffPriority.js";
import { buildNotificationFeed, unreadCount } from "../engines/notifications.js";
import { forecastInsights } from "../engines/forecast.js";
import { subscriptionLeakReport } from "../engines/subscriptionLeak.js";
import { getEffectiveLendingStatus } from "../utils/lendingStatus.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";

export function useCommitIntel() {
  const {
    commitments,
    lendings,
    settings,
    monthlySnapshots,
    todayStr,
    getEffectiveStatus,
    supplementalNotifications,
  } = useCommitTrack();

  return useMemo(() => {
    const income = combinedMonthlyIncome(settings);
    const burdenRatio = commitmentToIncomeRatio(commitments, income, getEffectiveStatus);
    const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);
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
    const insights = mergeExtendedInsights(baseInsights, extended);

    const score = computeCanonicalPressureScore({
      commitments,
      income,
      getEffectiveStatus,
      monthlySnapshots,
    });
    const stabilityMeta = pressureScoreLabel(score);

    const health = computeFinancialHealthScore({
      commitments,
      lendings,
      income,
      getEffectiveStatus,
      openRemaining,
      freeMoneyAfterBurden: cash.freeMoney,
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
      badgeClass: pressureScoreBadgeClass(stabilityMeta.level),
      committedPercent: cash.committedPercent,
      monthlyBurden: cash.monthlyBurden,
      freeMoney: cash.freeMoney,
    };

    return {
      income,
      openRemaining,
      freeMoneyAfterBurden: cash.freeMoney,
      burdenRatio,
      insights,
      stability,
      health,
      rankedPayoffs: ranked,
      payoffRec,
      notifications,
      notificationUnread: unreadCount(notifications),
      forecast,
      subscriptionLeak,
      yearlyBurden,
    };
  }, [
    commitments,
    lendings,
    settings,
    supplementalNotifications,
    monthlySnapshots,
    todayStr,
    getEffectiveStatus,
  ]);
}

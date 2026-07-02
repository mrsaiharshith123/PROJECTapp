import { useMemo } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";
import {
  getTier,
  tierHasFeature,
  canAddLendingRecord,
  canAddChitRecord,
  canAddGoal,
  canAddDailySpend,
  canRunBillSplit,
  cashflowDaysForTier,
  aheadForecastMonthsForTier,
} from "../utils/tierAccess.js";
import { hasPaidBackupTier } from "../constants/subscriptionTiers.js";

/**
 * Authoritative subscription tier + gated helpers (server tier when signed in).
 */
export function useAppTier() {
  const { settings, effectiveSubscriptionTier } = usePerovo();
  return useMemo(() => {
    const tier = getTier(settings, effectiveSubscriptionTier);
    return {
      tier,
      effectiveSubscriptionTier,
      hasFeature: (featureId) => tierHasFeature(featureId, settings, effectiveSubscriptionTier),
      hasPaidBackup: () => hasPaidBackupTier(settings, effectiveSubscriptionTier),
      canAddLending: (lendings) => canAddLendingRecord(settings, lendings, effectiveSubscriptionTier),
      canAddChit: (commitments, getEffectiveStatus) =>
        canAddChitRecord(settings, commitments, getEffectiveStatus, effectiveSubscriptionTier),
      canAddGoal: (goals) => canAddGoal(settings, goals, effectiveSubscriptionTier),
      canAddDailySpend: (dailySpends, todayStr) =>
        canAddDailySpend(settings, dailySpends, todayStr, effectiveSubscriptionTier),
      canRunBillSplit: (todayStr, participantCount) =>
        canRunBillSplit(settings, todayStr, participantCount, effectiveSubscriptionTier),
      cashflowDays: () => cashflowDaysForTier(settings, effectiveSubscriptionTier),
      aheadForecastMonths: () => aheadForecastMonthsForTier(settings, effectiveSubscriptionTier),
    };
  }, [settings, effectiveSubscriptionTier]);
}

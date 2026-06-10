import { format, parseISO } from "date-fns";
import { FREE_TIER_LIMITS, PRO_CASHFLOW_DAYS } from "../constants/tierLimits.js";
import { isFeatureUnlocked } from "../constants/subscriptionTiers.js";

/** @param {{ subscriptionTier?: string } | null | undefined} settings */
export function getTier(settings) {
  return settings?.subscriptionTier || "free";
}

/** @param {string} featureId @param {{ subscriptionTier?: string } | null | undefined} settings */
export function tierHasFeature(featureId, settings) {
  return isFeatureUnlocked(featureId, getTier(settings));
}

/** @param {object[]} lendings */
export function countActiveLendings(lendings) {
  return (lendings || []).filter((l) => {
    const rem = Number(l.remainingAmount) || 0;
    if (rem > 0) return true;
    return l.status !== "complete" && l.status !== "settled";
  }).length;
}

/** @param {object[]} commitments @param {(c: object) => string} getEffectiveStatus */
export function countActiveChits(commitments, getEffectiveStatus) {
  return (commitments || []).filter((c) => {
    if (c.category !== "Chit Fund" && !c.chitFund) return false;
    const st = getEffectiveStatus(c);
    return st !== "paid" && st !== "skipped";
  }).length;
}

/** @param {object[]} goals */
export function countActiveGoals(goals) {
  return (goals || []).filter((g) => g.active !== false && !g.archived).length;
}

/** @param {object[]} dailySpends @param {string} monthKey yyyy-MM */
export function countDailySpendsInMonth(dailySpends, monthKey) {
  return (dailySpends || []).filter((s) => String(s.date || "").startsWith(monthKey)).length;
}

/** @param {string} todayStr */
export function monthKeyFromToday(todayStr) {
  if (!todayStr) return format(new Date(), "yyyy-MM");
  try {
    return format(parseISO(`${todayStr}T12:00:00`), "yyyy-MM");
  } catch {
    return format(new Date(), "yyyy-MM");
  }
}

/**
 * @param {{ usageMonthKey?: string, billSplitsThisMonth?: number }} settings
 * @param {string} todayStr
 */
export function getBillSplitCountThisMonth(settings, todayStr) {
  const key = monthKeyFromToday(todayStr);
  if (settings?.usageMonthKey !== key) return 0;
  return Math.max(0, Number(settings?.billSplitsThisMonth) || 0);
}

/** @param {{ subscriptionTier?: string } | null | undefined} settings */
export function cashflowDaysForTier(settings) {
  return tierHasFeature("cashflow_90d", settings) ? PRO_CASHFLOW_DAYS : FREE_TIER_LIMITS.cashflowDays;
}

/**
 * @param {{ subscriptionTier?: string } | null | undefined} settings
 * @param {object[]} lendings
 */
export function canAddLendingRecord(settings, lendings) {
  if (tierHasFeature("unlimited_lending", settings)) {
    return { ok: true };
  }
  const count = countActiveLendings(lendings);
  if (count >= FREE_TIER_LIMITS.activeLendingRecords) {
    return {
      ok: false,
      reason: "lending_limit",
      limit: FREE_TIER_LIMITS.activeLendingRecords,
      count,
    };
  }
  return { ok: true };
}

/**
 * @param {{ subscriptionTier?: string } | null | undefined} settings
 * @param {object[]} commitments
 * @param {(c: object) => string} getEffectiveStatus
 */
export function canAddChitRecord(settings, commitments, getEffectiveStatus) {
  if (tierHasFeature("unlimited_chits", settings)) return { ok: true };
  const count = countActiveChits(commitments, getEffectiveStatus);
  if (count >= FREE_TIER_LIMITS.activeChitRecords) {
    return { ok: false, reason: "chit_limit", limit: FREE_TIER_LIMITS.activeChitRecords, count };
  }
  return { ok: true };
}

/**
 * @param {{ subscriptionTier?: string } | null | undefined} settings
 * @param {object[]} goals
 */
export function canAddGoal(settings, goals) {
  if (tierHasFeature("unlimited_goals", settings)) return { ok: true };
  const count = countActiveGoals(goals);
  if (count >= FREE_TIER_LIMITS.activeGoals) {
    return { ok: false, reason: "goals_limit", limit: FREE_TIER_LIMITS.activeGoals, count };
  }
  return { ok: true };
}

/**
 * @param {{ subscriptionTier?: string } | null | undefined} settings
 * @param {object[]} dailySpends
 * @param {string} todayStr
 */
export function canAddDailySpend(settings, dailySpends, todayStr) {
  if (tierHasFeature("unlimited_daily_spend", settings)) return { ok: true };
  const key = monthKeyFromToday(todayStr);
  const count = countDailySpendsInMonth(dailySpends, key);
  if (count >= FREE_TIER_LIMITS.dailySpendsPerMonth) {
    return { ok: false, reason: "spend_limit", limit: FREE_TIER_LIMITS.dailySpendsPerMonth, count };
  }
  return { ok: true };
}

/**
 * @param {{ subscriptionTier?: string, usageMonthKey?: string, billSplitsThisMonth?: number } | null | undefined} settings
 * @param {string} todayStr
 * @param {number} participantCount
 */
export function canRunBillSplit(settings, todayStr, participantCount) {
  if (tierHasFeature("unlimited_bill_split", settings)) return { ok: true };
  const splits = getBillSplitCountThisMonth(settings, todayStr);
  if (splits >= FREE_TIER_LIMITS.billSplitsPerMonth) {
    return { ok: false, reason: "split_limit", limit: FREE_TIER_LIMITS.billSplitsPerMonth, count: splits };
  }
  if (participantCount > FREE_TIER_LIMITS.billSplitParticipants) {
    return {
      ok: false,
      reason: "split_people_limit",
      limit: FREE_TIER_LIMITS.billSplitParticipants,
      count: participantCount,
    };
  }
  return { ok: true };
}

/** Patch to increment bill-split counter for the current month. */
export function billSplitUsagePatch(settings, todayStr) {
  const key = monthKeyFromToday(todayStr);
  const prev = settings?.usageMonthKey === key ? Number(settings?.billSplitsThisMonth) || 0 : 0;
  return { usageMonthKey: key, billSplitsThisMonth: prev + 1 };
}

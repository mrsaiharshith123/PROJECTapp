import { useMemo } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";
import { useCommitIntel } from "./useCommitIntel.js";
import { useStabilityIntel } from "./useStabilityIntel.js";
import { useCloudSync } from "./useCloudSync.js";
import { computePaymentMonthStreak } from "../utils/profileStats.js";
import { snapshotsToPressureTrend } from "../engines/analyticsSeries.js";
import { formatInr } from "../constants/symbols.js";
import { isActiveBill } from "../utils/billLifecycle.js";

/** Profile hub metrics — composes existing intel without new engines. */
export function useProfileHubIntel() {
  const ctx = usePerovo();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const sync = useCloudSync();

  return useMemo(() => {
    const pressureTrend = snapshotsToPressureTrend(ctx.monthlySnapshots, 3);
    const pressureDelta =
      pressureTrend.length >= 2
        ? (pressureTrend[pressureTrend.length - 1].pressure || 0) - (pressureTrend[0].pressure || 0)
        : 0;
    const paymentStreak = computePaymentMonthStreak(ctx.commitments, ctx.lendings);
    const emergency = stable.emergency;
    const overdueCount = ctx.commitments.filter((c) => ctx.getEffectiveStatus(c) === "overdue").length;
    const pendingCount = ctx.commitments.filter(
      (c) => isActiveBill(c, ctx.getEffectiveStatus, ctx.todayStr) && ctx.getEffectiveStatus(c) === "pending",
    ).length;

    const syncLabel = sync.enabled
      ? sync.busy
        ? "syncing"
        : "cloud"
      : sync.configured && ctx.settings.cloudSyncEnabled
        ? "ready"
        : "local";

    const journey = [];
    if (pressureDelta < -3) {
      journey.push({ id: "pressure-down", tone: "positive", key: "profileHub.journey.pressureDown" });
    } else if (pressureDelta > 5) {
      journey.push({ id: "pressure-up", tone: "caution", key: "profileHub.journey.pressureUp" });
    }
    if (emergency?.progressPercent >= 60) {
      journey.push({ id: "emergency-ok", tone: "positive", key: "profileHub.journey.emergencyImproved" });
    } else if (emergency?.tier === "critical" || emergency?.tier === "building") {
      journey.push({ id: "emergency-build", tone: "neutral", key: "profileHub.journey.emergencyBuilding" });
    }
    if (stable.lifestyle?.hasTrend && stable.lifestyle.growthPercent >= 10) {
      journey.push({ id: "recurring-watch", tone: "caution", key: "profileHub.journey.recurringWatch" });
    } else if (stable.lifestyle?.hasTrend === false || (stable.lifestyle?.growthPercent ?? 0) < 8) {
      journey.push({ id: "recurring-stable", tone: "positive", key: "profileHub.journey.recurringStable" });
    }
    if (paymentStreak >= 2) {
      journey.push({
        id: "streak",
        tone: "positive",
        key: "profileHub.journey.streak",
        params: { months: paymentStreak },
      });
    }

    return {
      pressureScore: intel.stability.score,
      pressureLabel: intel.stability.label,
      freeMoney: intel.freeMoneyAfterBurden,
      burdenRatio: intel.burdenRatio,
      overdueCount,
      pendingCount,
      emergency,
      paymentStreak,
      pressureDelta,
      syncLabel,
      syncBusy: sync.busy,
      journey: journey.slice(0, 4),
      formatFreeMoney: formatInr(Math.max(0, Math.round(intel.freeMoneyAfterBurden))),
    };
  }, [ctx, intel, stable, sync.busy, sync.configured, sync.enabled]);
}

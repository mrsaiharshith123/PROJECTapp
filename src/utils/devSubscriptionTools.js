import {
  completeSimulatedSubscriptionUpgrade,
  isPaymentSimulationEnabled,
} from "../services/simulateSubscriptionPayment.js";

/** @type {{ updateSettings?: (patch: object) => void, userId?: string|null } | null} */
let bridge = null;

export function registerDevSubscriptionTools(next) {
  if (!isPaymentSimulationEnabled()) return;
  bridge = next;
  if (typeof window !== "undefined") {
    window.__commitTrackDev = {
      ...(window.__commitTrackDev || {}),
      /** @param {"pro"|"power"} tier */
      async simulatePayment(tier) {
        if (!bridge?.updateSettings) {
          throw new Error("App not ready — open CommitTrack first, then retry.");
        }
        return completeSimulatedSubscriptionUpgrade({
          tier,
          userId: bridge.userId,
          updateSettings: bridge.updateSettings,
        });
      },
      resetSubscription() {
        if (!bridge?.updateSettings) {
          throw new Error("App not ready — open CommitTrack first, then retry.");
        }
        bridge.updateSettings({ subscriptionTier: "free", cloudSyncEnabled: false });
        return { tier: "free" };
      },
    };
  }
}

export function unregisterDevSubscriptionTools() {
  bridge = null;
  if (typeof window !== "undefined" && window.__commitTrackDev) {
    delete window.__commitTrackDev.simulatePayment;
    delete window.__commitTrackDev.resetSubscription;
  }
}

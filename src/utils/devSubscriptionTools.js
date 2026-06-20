import {
  completeSimulatedSubscriptionUpgrade,
  isPaymentSimulationEnabled,
} from "../services/simulateSubscriptionPayment.js";
import {
  IS_DEV,
  setDevOverride,
  clearDevOverride,
  setForceShowAll,
  DEV_PRESETS,
  getDevOverride,
} from "./devOverride.js";

/** @type {{ updateSettings?: (patch: object) => void, userId?: string|null } | null} */
let bridge = null;

function attachDevConsoleHelpers() {
  if (!IS_DEV || typeof window === "undefined") return;
  window.__perovoDev = {
    ...(window.__perovoDev || {}),
    setOverride: setDevOverride,
    clearOverride: clearDevOverride,
    getOverride: getDevOverride,
    /** @param {string} name */
    preset: (name) => {
      const p = DEV_PRESETS[name];
      if (!p) {
        console.log("Available:", Object.keys(DEV_PRESETS));
        return;
      }
      setDevOverride(p.state);
      if (p.state.subscriptionTier && bridge?.updateSettings) {
        bridge.updateSettings({ subscriptionTier: p.state.subscriptionTier });
      }
      console.log("✓ Applied:", p.label);
    },
    /** @param {boolean} [on] */
    force: (on = true) => {
      setForceShowAll(on);
      console.log("Force show all:", on ? "ON" : "OFF");
    },
    clear: () => {
      clearDevOverride();
      console.log("✓ Overrides cleared");
    },
    help: () => {
      console.log(`
Perovo Dev Tools:
  __perovoDev.preset("critical")      — simulate critical financial state
  __perovoDev.preset("high_pressure") — simulate high pressure state
  __perovoDev.preset("power_user")    — unlock all Pro/Power features
  __perovoDev.preset("healthy")       — healthy finances state
  __perovoDev.preset("clean_slate")   — fresh new user
  __perovoDev.force(true)             — force-show ALL conditional features
  __perovoDev.force(false)            — disable force-show
  __perovoDev.simulatePayment("pro")  — upgrade to Pro tier
  __perovoDev.simulatePayment("power")— upgrade to Power tier
  __perovoDev.clear()                 — clear all overrides
  Navigate to /dev for the full visual panel.
      `);
    },
  };
  console.log("🔧 Perovo dev tools ready. Type __perovoDev.help() to see commands.");
}

if (IS_DEV) {
  attachDevConsoleHelpers();
}

export function registerDevSubscriptionTools(next) {
  bridge = next;
  if (!IS_DEV || typeof window === "undefined") return;
  attachDevConsoleHelpers();
  if (isPaymentSimulationEnabled()) {
    window.__perovoDev = {
      ...(window.__perovoDev || {}),
      /** @param {"pro"|"power"} tier */
      async simulatePayment(tier) {
        if (!bridge?.updateSettings) {
          throw new Error("App not ready — open Perovo first, then retry.");
        }
        return completeSimulatedSubscriptionUpgrade({
          tier,
          userId: bridge.userId,
          updateSettings: bridge.updateSettings,
        });
      },
      resetSubscription() {
        if (!bridge?.updateSettings) {
          throw new Error("App not ready — open Perovo first, then retry.");
        }
        bridge.updateSettings({ subscriptionTier: "free", cloudSyncEnabled: false });
        return { tier: "free" };
      },
    };
  }
}

export function unregisterDevSubscriptionTools() {
  bridge = null;
  if (typeof window !== "undefined" && window.__perovoDev) {
    delete window.__perovoDev.simulatePayment;
    delete window.__perovoDev.resetSubscription;
  }
}

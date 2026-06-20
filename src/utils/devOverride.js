import { useEffect, useState } from "react";
import { survivalTierFromMonths } from "../engines/survival.js";

export const DEV_OVERRIDE_KEY = "perovo_dev_override";
export const DEV_FORCE_KEY = "perovo_dev_force_all";
export const DEV_CHANGE_EVENT = "perovo_dev_change";

export const IS_DEV = import.meta.env.DEV === true;

export function getDevOverride() {
  if (!IS_DEV) return null;
  try {
    const raw = localStorage.getItem(DEV_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setDevOverride(patch) {
  if (!IS_DEV) return;
  const current = getDevOverride() || {};
  const next = { ...current, ...patch };
  localStorage.setItem(DEV_OVERRIDE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(DEV_CHANGE_EVENT));
}

export function clearDevOverride() {
  if (!IS_DEV) return;
  localStorage.removeItem(DEV_OVERRIDE_KEY);
  localStorage.removeItem(DEV_FORCE_KEY);
  window.dispatchEvent(new Event(DEV_CHANGE_EVENT));
}

export function isForceShowAll() {
  if (!IS_DEV) return false;
  return localStorage.getItem(DEV_FORCE_KEY) === "1";
}

export function setForceShowAll(on) {
  if (!IS_DEV) return;
  if (on) localStorage.setItem(DEV_FORCE_KEY, "1");
  else localStorage.removeItem(DEV_FORCE_KEY);
  window.dispatchEvent(new Event(DEV_CHANGE_EVENT));
}

/** @type {Record<string, { label: string, state: object }>} */
export const DEV_PRESETS = {
  clean_slate: {
    label: "Clean slate (new user)",
    state: {
      pressureScore: 0,
      survivalMonths: 99,
      overdueCount: 0,
      freeCash: 50000,
      subscriptionTier: "free",
    },
  },
  healthy: {
    label: "Healthy finances",
    state: {
      pressureScore: 35,
      survivalMonths: 8,
      overdueCount: 0,
      freeCash: 18000,
      subscriptionTier: "free",
    },
  },
  moderate_stress: {
    label: "Moderate stress",
    state: {
      pressureScore: 62,
      survivalMonths: 3.5,
      overdueCount: 1,
      freeCash: 4000,
      subscriptionTier: "pro",
    },
  },
  high_pressure: {
    label: "High pressure (triggers all warnings)",
    state: {
      pressureScore: 82,
      survivalMonths: 1.2,
      overdueCount: 3,
      freeCash: -2000,
      subscriptionTier: "pro",
    },
  },
  critical: {
    label: "Critical survival (triggers emergency UI)",
    state: {
      pressureScore: 95,
      survivalMonths: 0.4,
      overdueCount: 5,
      freeCash: -8000,
      subscriptionTier: "pro",
    },
  },
  power_user: {
    label: "Power tier (shows all gated features)",
    state: {
      pressureScore: 45,
      survivalMonths: 6,
      overdueCount: 0,
      freeCash: 22000,
      subscriptionTier: "power",
    },
  },
};

/** Re-render consumers when dev overrides change. */
export function useDevOverrideTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!IS_DEV) return undefined;
    const handler = () => setTick((n) => n + 1);
    window.addEventListener(DEV_CHANGE_EVENT, handler);
    return () => window.removeEventListener(DEV_CHANGE_EVENT, handler);
  }, []);
}

/** @param {string | undefined} tier */
export function getEffectiveDevTier(tier) {
  if (!IS_DEV) return tier || "free";
  const ov = getDevOverride();
  if (ov?.subscriptionTier) return ov.subscriptionTier;
  return tier || "free";
}

/** @param {object} intel */
export function applyDevOverrideToCommitIntel(intel) {
  if (!IS_DEV || !intel) return intel;
  const ov = getDevOverride();
  if (!ov) return intel;

  let next = { ...intel };
  if (ov.pressureScore != null || ov.freeCash != null) {
    next = {
      ...next,
      stability: {
        ...(next.stability || {}),
        ...(ov.pressureScore != null ? { score: ov.pressureScore } : {}),
        ...(ov.freeCash != null ? { freeMoney: ov.freeCash } : {}),
      },
      ...(ov.freeCash != null ? { freeMoneyAfterBurden: ov.freeCash } : {}),
    };
  }
  return next;
}

/** @param {object} stable */
export function applyDevOverrideToStabilityIntel(stable) {
  if (!IS_DEV || !stable) return stable;
  const ov = getDevOverride();
  if (!ov) return stable;

  let next = { ...stable };
  if (ov.overdueCount != null) {
    next.overdueCount = ov.overdueCount;
  }
  if (ov.survivalMonths != null) {
    const tierMeta = survivalTierFromMonths(ov.survivalMonths);
    next.survival = {
      ...(next.survival || {}),
      survivalMonths: ov.survivalMonths,
      tier: tierMeta.tier,
      tierLabel: tierMeta.label,
    };
  }
  return next;
}

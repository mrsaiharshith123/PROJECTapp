import { SUBSCRIPTION_TIERS } from "../constants/subscriptionTiers.js";

/** Annual plan prices in paise (INR × 100). */
export const TIER_ANNUAL_PAISE = {
  [SUBSCRIPTION_TIERS.pro]: 79900,
  [SUBSCRIPTION_TIERS.power]: 149900,
};

export function getTierAnnualPaise(tier) {
  return TIER_ANNUAL_PAISE[tier] ?? null;
}

export function isRazorpayKeyPresent(keyId = import.meta.env.VITE_RAZORPAY_KEY_ID) {
  const raw = String(keyId ?? "").trim();
  if (!raw) return false;
  if (raw.includes("xxxx")) return false;
  return raw.startsWith("rzp_test_") || raw.startsWith("rzp_live_");
}

export function isRazorpayConfigured() {
  return isRazorpayKeyPresent();
}

export function isRazorpayTestMode() {
  const keyId = String(import.meta.env.VITE_RAZORPAY_KEY_ID ?? "").trim();
  return keyId.startsWith("rzp_test_");
}

/**
 * Dev simulation runs only when Razorpay is not configured.
 * Set VITE_SIMULATE_PAYMENTS=true to force simulation even with a key (rare).
 */
export function isPaymentSimulationEnabled() {
  if (import.meta.env.VITE_SIMULATE_PAYMENTS === "true" && !isRazorpayConfigured()) {
    return true;
  }
  if (isRazorpayConfigured()) return false;
  return import.meta.env.DEV || import.meta.env.VITE_SIMULATE_PAYMENTS === "true";
}

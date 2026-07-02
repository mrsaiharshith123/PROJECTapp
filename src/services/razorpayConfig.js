import { PLAN_PRESENTATION, SUBSCRIPTION_TIERS } from "../constants/subscriptionTiers.js";

/**
 * @param {"pro"|"power"|string} tier
 * @param {"monthly"|"yearly"} [billing]
 */
export function getTierPaise(tier, billing = "yearly") {
  const plan = PLAN_PRESENTATION.find((p) => p.tier === tier);
  if (!plan) return null;
  const inr = billing === "monthly" ? plan.monthlyInr : plan.annualInr;
  return inr > 0 ? inr * 100 : null;
}

/** Annual plan prices in paise (INR × 100) — synced from PLAN_PRESENTATION. */
export const TIER_ANNUAL_PAISE = {
  [SUBSCRIPTION_TIERS.pro]: getTierPaise(SUBSCRIPTION_TIERS.pro, "yearly"),
  [SUBSCRIPTION_TIERS.power]: getTierPaise(SUBSCRIPTION_TIERS.power, "yearly"),
};

/** Monthly plan prices in paise (INR × 100). */
export const TIER_MONTHLY_PAISE = {
  [SUBSCRIPTION_TIERS.pro]: getTierPaise(SUBSCRIPTION_TIERS.pro, "monthly"),
  [SUBSCRIPTION_TIERS.power]: getTierPaise(SUBSCRIPTION_TIERS.power, "monthly"),
};

export function getTierAnnualPaise(tier) {
  return getTierPaise(tier, "yearly");
}

export function getTierMonthlyPaise(tier) {
  return getTierPaise(tier, "monthly");
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
  if (import.meta.env.PROD) return false;
  return import.meta.env.VITE_SIMULATE_PAYMENTS === "true";
}

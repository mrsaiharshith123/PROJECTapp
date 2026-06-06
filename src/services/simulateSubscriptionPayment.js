import { saveSubscriptionTier } from "./supabase/auth.js";

/** Dev / test builds only — never enable in production deploys. */
export function isPaymentSimulationEnabled() {
  return import.meta.env.DEV || import.meta.env.VITE_SIMULATE_PAYMENTS === "true";
}

/**
 * Grants a paid tier as if Razorpay succeeded (local + Supabase when signed in).
 * @param {{ tier: "pro"|"power", userId?: string|null, updateSettings: (patch: object) => void }} opts
 */
export async function completeSimulatedSubscriptionUpgrade({ tier, userId, updateSettings }) {
  if (!isPaymentSimulationEnabled()) {
    throw new Error("Payment simulation is disabled outside dev / VITE_SIMULATE_PAYMENTS.");
  }
  if (tier !== "pro" && tier !== "power") {
    throw new Error('Simulated tier must be "pro" or "power".');
  }

  const paymentId = `dev_sim_${Date.now()}`;
  await saveSubscriptionTier(userId, tier, paymentId);
  updateSettings({ subscriptionTier: tier });
  return { paymentId, tier };
}

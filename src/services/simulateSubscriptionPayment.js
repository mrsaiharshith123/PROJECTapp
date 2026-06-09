import { saveSubscriptionTier } from "./supabase/auth.js";
import { isPaymentSimulationEnabled } from "./razorpayConfig.js";

export { isPaymentSimulationEnabled } from "./razorpayConfig.js";

/**
 * Grants a paid tier as if Razorpay succeeded (local + Supabase when signed in).
 * @param {{ tier: "pro"|"power", userId?: string|null, updateSettings: (patch: object) => void }} opts
 */
export async function completeSimulatedSubscriptionUpgrade({ tier, userId, updateSettings }) {
  if (!isPaymentSimulationEnabled()) {
    throw new Error("Payment simulation is disabled when Razorpay is configured.");
  }
  if (tier !== "pro" && tier !== "power") {
    throw new Error('Simulated tier must be "pro" or "power".');
  }

  const paymentId = `dev_sim_${Date.now()}`;
  await saveSubscriptionTier(userId, tier, paymentId);
  updateSettings({ subscriptionTier: tier });
  return { paymentId, tier };
}

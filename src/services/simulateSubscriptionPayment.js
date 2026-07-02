import { getSupabaseClient } from "./supabase/auth.js";
import { invokeEdgeFunction } from "./supabase/invokeEdgeFunction.js";
import { isPaymentSimulationEnabled } from "./razorpayConfig.js";

export { isPaymentSimulationEnabled } from "./razorpayConfig.js";

const FUNCTION_NAME = "razorpay-checkout";

/**
 * Grants a paid tier as if Razorpay succeeded (server-side via edge when signed in).
 * @param {{ tier: "pro"|"power", userId?: string|null, updateSettings: (patch: object) => void }} opts
 */
export async function completeSimulatedSubscriptionUpgrade({ tier, userId, updateSettings }) {
  if (!isPaymentSimulationEnabled()) {
    throw new Error("Payment simulation is disabled when Razorpay is configured.");
  }
  if (tier !== "pro" && tier !== "power") {
    throw new Error('Simulated tier must be "pro" or "power".');
  }

  let paymentId = `dev_sim_${Date.now()}`;
  let serverTier = tier;

  if (userId) {
    const { data, error } = await invokeEdgeFunction(FUNCTION_NAME, {
      body: { action: "dev-simulate", tier },
    });
    if (error) throw new Error(error || "Simulated upgrade failed.");
    if (data?.error) throw new Error(String(data.error));
    paymentId = data?.paymentId || paymentId;
    serverTier = data?.tier === "pro" || data?.tier === "power" ? data.tier : tier;
    updateSettings({ subscriptionTier: serverTier });
    return { paymentId, tier: serverTier };
  }

  updateSettings({ subscriptionTier: serverTier });
  return { paymentId, tier: serverTier };
}

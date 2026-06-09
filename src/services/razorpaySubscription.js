import { getTierAnnualPaise, isRazorpayConfigured } from "./razorpayConfig.js";
import { getSupabaseClient, saveSubscriptionTier } from "./supabase/auth.js";

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const LOAD_TIMEOUT_MS = 8000;
const FUNCTION_NAME = "razorpay-checkout";

/** @returns {Promise<typeof window.Razorpay>} */
function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay is only available in the browser"));
  }
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay));
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;

    const timer = setTimeout(() => {
      reject(new Error("Razorpay script load timed out"));
    }, LOAD_TIMEOUT_MS);

    script.onload = () => {
      clearTimeout(timer);
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay unavailable after script load"));
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Razorpay script failed to load"));
    };

    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay checkout modal.
 * @param {object} opts
 * @param {number} opts.amountPaise
 * @param {string} [opts.orderId]
 * @param {string} opts.description
 * @param {string} [opts.prefillName]
 * @param {string} [opts.prefillEmail]
 * @param {string} [opts.prefillPhone]
 * @param {(response: { razorpay_payment_id: string, razorpay_order_id?: string, razorpay_signature?: string }) => void} opts.onSuccess
 * @param {() => void} opts.onDismiss
 * @param {(err: Error) => void} opts.onError
 */
async function openRazorpayCheckout({
  amountPaise,
  orderId = "",
  description,
  prefillName = "",
  prefillEmail = "",
  prefillPhone = "",
  onSuccess,
  onDismiss,
  onError,
}) {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!keyId) {
    onError(new Error("Payment is not configured. Add VITE_RAZORPAY_KEY_ID to .env"));
    return;
  }

  try {
    const Razorpay = await loadRazorpayScript();
    const options = {
      key: keyId,
      amount: amountPaise,
      currency: "INR",
      name: "CommitTrack",
      description,
      prefill: {
        name: prefillName,
        email: prefillEmail,
        ...(prefillPhone ? { contact: prefillPhone } : {}),
      },
      theme: { color: "#7C5CFF" },
      handler(response) {
        onSuccess(response);
      },
      modal: {
        ondismiss() {
          onDismiss();
        },
      },
    };

    if (orderId) {
      options.order_id = orderId;
    }

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", (response) => {
      const reason = response?.error?.description || response?.error?.reason || "Payment failed";
      onError(new Error(reason));
    });
    rzp.open();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {Record<string, unknown>} body
 */
async function invokeCheckoutFunction(supabase, body) {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body });
  if (error) {
    throw new Error(error.message || "Payment service unavailable");
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  return data;
}

/**
 * @param {"pro"|"power"} tier
 * @param {string} userId
 * @returns {Promise<{ orderId: string, amount: number } | null>}
 */
async function createServerOrder(tier, userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;

  try {
    const data = await invokeCheckoutFunction(supabase, { action: "create-order", tier });
    if (!data?.orderId) return null;
    return { orderId: String(data.orderId), amount: Number(data.amount) };
  } catch {
    return null;
  }
}

/**
 * @param {"pro"|"power"} tier
 * @param {string} userId
 * @param {{ razorpay_payment_id: string, razorpay_order_id?: string, razorpay_signature?: string }} payment
 */
async function verifyServerPayment(tier, userId, payment) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;
  if (!payment.razorpay_order_id || !payment.razorpay_signature) return false;

  try {
    const data = await invokeCheckoutFunction(supabase, {
      action: "verify",
      tier,
      razorpay_payment_id: payment.razorpay_payment_id,
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_signature: payment.razorpay_signature,
    });
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

/**
 * Full Razorpay upgrade flow: optional server order + checkout + verify.
 * @param {{
 *   tier: "pro"|"power",
 *   userId?: string|null,
 *   settings: { displayName?: string, phoneNumber?: string },
 *   user?: import("../types/context.js").AuthUser | null,
 *   updateSettings: (patch: object) => void,
 *   onSuccess: (result: { tier: string, paymentId: string, verified: boolean }) => void,
 *   onDismiss: () => void,
 *   onError: (err: Error) => void,
 * }} opts
 */
export async function startSubscriptionCheckout({
  tier,
  userId,
  settings,
  user,
  updateSettings,
  onSuccess,
  onDismiss,
  onError,
}) {
  if (!isRazorpayConfigured()) {
    onError(new Error("Add VITE_RAZORPAY_KEY_ID (rzp_test_…) to .env and restart the dev server."));
    return;
  }

  const amountPaise = getTierAnnualPaise(tier);
  if (!amountPaise) {
    onError(new Error("Invalid plan tier."));
    return;
  }

  const serverOrder = userId ? await createServerOrder(tier, userId) : null;

  await openRazorpayCheckout({
    amountPaise: serverOrder?.amount ?? amountPaise,
    orderId: serverOrder?.orderId ?? "",
    description: `CommitTrack ${tier === "pro" ? "Pro" : "Power"} Annual`,
    prefillName: settings.displayName || "",
    prefillEmail: user?.email || "",
    prefillPhone: settings.phoneNumber || "",
    onSuccess: async (payment) => {
      try {
        let verified = false;

        if (userId && payment.razorpay_order_id && payment.razorpay_signature) {
          verified = await verifyServerPayment(tier, userId, payment);
        }

        if (!verified) {
          await saveSubscriptionTier(userId, tier, payment.razorpay_payment_id);
        }

        updateSettings({ subscriptionTier: tier });
        onSuccess({
          tier,
          paymentId: payment.razorpay_payment_id,
          verified,
        });
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onDismiss,
    onError,
  });
}

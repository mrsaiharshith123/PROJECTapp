const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const LOAD_TIMEOUT_MS = 8000;

/** @returns {Promise<typeof window.Razorpay>} */
export function loadRazorpayScript() {
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
 * TODO: verify payment server-side via Supabase Edge Function before granting tier in production.
 */
export async function openRazorpayCheckout({
  amountPaise,
  description,
  prefillName = "",
  prefillEmail = "",
  onSuccess,
  onDismiss,
  onError,
}) {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!keyId) {
    onError(new Error("Payment is not configured. Add VITE_RAZORPAY_KEY_ID."));
    return;
  }

  try {
    const Razorpay = await loadRazorpayScript();
    const rzp = new Razorpay({
      key: keyId,
      amount: amountPaise,
      currency: "INR",
      name: "CommitTrack",
      description,
      prefill: { name: prefillName, email: prefillEmail },
      theme: { color: "#7C5CFF" },
      handler(response) {
        onSuccess(response.razorpay_payment_id);
      },
      modal: {
        ondismiss() {
          onDismiss();
        },
      },
    });
    rzp.open();
  } catch (err) {
    onError(err);
  }
}

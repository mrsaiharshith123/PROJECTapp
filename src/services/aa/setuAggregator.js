const SETU_BASE = import.meta.env.VITE_SETU_AA_BASE || "https://fiu-sandbox.setu.co";
const SETU_CLIENT_ID = import.meta.env.VITE_SETU_CLIENT_ID || "";
const SETU_CLIENT_SECRET = import.meta.env.VITE_SETU_CLIENT_SECRET || "";

export function isAaConfigured() {
  return Boolean(SETU_CLIENT_ID && SETU_CLIENT_SECRET);
}

/**
 * @param {{ phone: string, purpose?: string }} params
 */
export async function createConsentRequest({ phone, purpose }) {
  if (!isAaConfigured()) return { error: "aa_not_configured" };
  try {
    const res = await fetch(`${SETU_BASE}/v2/consents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": SETU_CLIENT_ID,
        "x-client-secret": SETU_CLIENT_SECRET,
      },
      body: JSON.stringify({
        consentDuration: { unit: "MONTH", value: "12" },
        vua: `${String(phone || "").replace(/\D/g, "")}@onemoney`,
        dataRange: {
          from: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
        context: [],
        purpose: { code: "101", text: purpose || "Personal finance management" },
      }),
    });
    const data = await res.json();
    return { consentId: data.id, consentUrl: data.url, status: "pending" };
  } catch {
    return { error: "network_error" };
  }
}

/** @param {string} consentId */
export async function fetchAccountData(consentId) {
  if (!isAaConfigured() || !consentId) return null;
  return { pending: true, message: "AA data fetch requires production approval" };
}

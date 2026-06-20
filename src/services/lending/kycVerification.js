const SUREPASS_BASE = "https://kyc-api.surepass.io/api/v1";
const SUREPASS_TOKEN = import.meta.env.VITE_SUREPASS_TOKEN || "";

export function isKycConfigured() {
  return Boolean(SUREPASS_TOKEN);
}

/** @param {string} panNumber */
export async function verifyPan(panNumber) {
  if (!SUREPASS_TOKEN) return { verified: false, error: "kyc_not_configured" };
  const cleanPan = panNumber.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
    return { verified: false, error: "invalid_pan_format" };
  }
  try {
    const res = await fetch(`${SUREPASS_BASE}/pan/pan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUREPASS_TOKEN}`,
      },
      body: JSON.stringify({ id_number: cleanPan }),
    });
    const data = await res.json();
    if (!res.ok || !data?.data) return { verified: false, error: data?.message || "pan_not_found" };
    return {
      verified: true,
      name: data.data.name || "",
      panStatus: data.data.pan_status || "",
      nameOnPan: data.data.name || "",
    };
  } catch {
    return { verified: false, error: "network_error" };
  }
}

/** @param {{ accountNumber: string, ifsc: string }} params */
export async function verifyBankAccount({ accountNumber, ifsc }) {
  if (!SUREPASS_TOKEN) return { verified: false, error: "kyc_not_configured" };
  try {
    const res = await fetch(`${SUREPASS_BASE}/bank-verification/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUREPASS_TOKEN}`,
      },
      body: JSON.stringify({ id_number: accountNumber, ifsc }),
    });
    const data = await res.json();
    if (!res.ok || !data?.data) return { verified: false, error: data?.message || "account_not_found" };
    return {
      verified: true,
      accountName: data.data.full_name || data.data.account_name || "",
      ifsc: data.data.ifsc || ifsc,
      bankName: data.data.bank_name || "",
    };
  } catch {
    return { verified: false, error: "network_error" };
  }
}

import { invokeApiProxy, isApiProxyAvailable } from "../apiProxy.js";

export function isKycConfigured() {
  return isApiProxyAvailable();
}

/** @param {string} panNumber */
export async function verifyPan(panNumber) {
  if (!isKycConfigured()) return { verified: false, error: "kyc_not_configured" };
  const data = await invokeApiProxy({ service: "kyc-pan", panNumber });
  if (!data) return { verified: false, error: "kyc_not_configured" };
  return data;
}

/** @param {{ accountNumber: string, ifsc: string }} params */
export async function verifyBankAccount({ accountNumber, ifsc }) {
  if (!isKycConfigured()) return { verified: false, error: "kyc_not_configured" };
  const data = await invokeApiProxy({ service: "kyc-bank", accountNumber, ifsc });
  if (!data) return { verified: false, error: "kyc_not_configured" };
  return data;
}

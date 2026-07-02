import { invokeApiProxy, isApiProxyAvailable } from "../apiProxy.js";

/** @param {object} params */
export async function createLeegalityDocument({
  pdfBase64,
  signerName,
  signerEmail,
  signerPhone,
  signerAadhaar,
  documentTitle,
}) {
  try {
    const data = await invokeApiProxy({
      service: "leegality-create",
      pdfBase64,
      signerName,
      signerEmail,
      signerPhone,
      signerAadhaar,
      documentTitle,
    });
    if (!data) return { error: "esign_not_configured" };
    if (data.error) return { error: data.error };
    return {
      documentId: data.documentId,
      signingUrl: data.signingUrl,
      status: data.status || "pending",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" };
  }
}

/** @param {string} documentId */
export async function checkLeegalityStatus(documentId) {
  if (!documentId || !isESignConfigured()) return null;
  try {
    const data = await invokeApiProxy({ service: "leegality-status", documentId });
    if (!data || data.error) return null;
    return {
      documentId,
      status: data.status,
      signedPdfUrl: data.signedPdfUrl || null,
      completedAt: data.completedAt || null,
    };
  } catch {
    return null;
  }
}

export function isESignConfigured() {
  return isApiProxyAvailable();
}

export function buildESignFallbackNoteKey() {
  return "lending.esign.fallbackNote";
}

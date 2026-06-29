const LEEGALITY_BASE = import.meta.env.VITE_LEEGALITY_BASE_URL || "https://sandbox.leegality.com";
const LEEGALITY_TOKEN = import.meta.env.VITE_LEEGALITY_API_TOKEN || "";

/** @param {object} params */
export async function createLeegalityDocument({
  pdfBase64,
  signerName,
  signerEmail,
  signerPhone,
  signerAadhaar,
  documentTitle,
}) {
  const payload = {
    name: String(documentTitle || "Perovo Agreement").slice(0, 100),
    description: "Promissory note — Perovo Financial OS",
    file_data: pdfBase64,
    signers: [
      {
        name: String(signerName || "").slice(0, 100),
        email: signerEmail || "",
        phone: String(signerPhone || "").replace(/\D/g, "").slice(-10),
        sign_type: "AADHAAR_OTP",
        ...(signerAadhaar ? { aadhaar: String(signerAadhaar).replace(/\s/g, "").slice(-4) } : {}),
      },
    ],
    notify_signers: true,
    send_email: Boolean(signerEmail),
  };

  try {
    const res = await fetch(`${LEEGALITY_BASE}/api/v3.0/document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": LEEGALITY_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg =
        data && typeof data === "object" && "message" in data ? String(/** @type {{ message?: string }} */ (data).message) : "";
      return { error: msg || "Leegality API error" };
    }
    const doc = /** @type {{ documentId?: string, id?: string, signers?: { invitationUrl?: string }[], signing_url?: string }} */ (data);
    return {
      documentId: doc.documentId || doc.id,
      signingUrl: doc.signers?.[0]?.invitationUrl || doc.signing_url,
      status: "pending",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error" };
  }
}

/** @param {string} documentId */
export async function checkLeegalityStatus(documentId) {
  if (!documentId || !LEEGALITY_TOKEN) return null;
  try {
    const res = await fetch(`${LEEGALITY_BASE}/api/v3.0/document/${documentId}`, {
      headers: { "X-Auth-Token": LEEGALITY_TOKEN },
    });
    const data = /** @type {{ status?: string, signedFileUrl?: string, completedAt?: string }} */ (await res.json());
    return {
      documentId,
      status: data.status,
      signedPdfUrl: data.signedFileUrl || null,
      completedAt: data.completedAt || null,
    };
  } catch {
    return null;
  }
}

export function isESignConfigured() {
  return Boolean(import.meta.env.VITE_LEEGALITY_API_TOKEN);
}

export function buildESignFallbackNoteKey() {
  return "lending.esign.fallbackNote";
}

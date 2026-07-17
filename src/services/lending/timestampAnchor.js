/**
 * External timestamp anchor for a sealed agreement hash, using
 * OpenTimestamps (an open, free, Bitcoin-backed timestamping network —
 * https://opentimestamps.org). The point of anchoring outside Perovo's own
 * storage: if Perovo's backend were ever compromised, an attacker who
 * rewrites both a document and its locally-stored hash together leaves no
 * trace. A hash submitted here is attested by a calendar server outside our
 * infrastructure, so tampering after the fact becomes provable without
 * having to trust Perovo at all.
 *
 * IMPORTANT: this calls a real third-party network endpoint. It has not
 * been exercised against a live server in this environment (no network
 * egress here) — treat the exact request/response handling as unverified
 * until it's been run for real once.
 */

const CALENDAR_URL = "https://alice.btc.calendar.opentimestamps.org/digest";

function hexToBytes(hex) {
  const clean = String(hex || "").trim();
  if (!/^[0-9a-f]{64}$/i.test(clean)) {
    throw new Error("Expected a 64-character SHA-256 hex digest");
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Submits a SHA-256 hex digest to the OpenTimestamps calendar server and
 * returns the raw attestation it hands back, base64-encoded for storage.
 * @param {string} hashHex — 64-char SHA-256 hex digest (e.g. from agreementExport.js hashText)
 * @returns {Promise<{ proof: string, calendarUrl: string, submittedAt: number }>}
 */
export async function submitTimestampAnchor(hashHex) {
  const digest = hexToBytes(hashHex);

  const res = await fetch(CALENDAR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: digest,
  });

  if (!res.ok) {
    throw new Error(`Timestamp calendar server returned ${res.status}`);
  }

  const buf = await res.arrayBuffer();
  if (!buf.byteLength) {
    throw new Error("Timestamp calendar server returned an empty response");
  }

  return {
    proof: bytesToBase64(new Uint8Array(buf)),
    calendarUrl: CALENDAR_URL,
    submittedAt: Date.now(),
  };
}

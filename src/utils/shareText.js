/**
 * Share plain text via Web Share API when available; otherwise copy to clipboard.
 * @returns {Promise<{ ok: boolean, method: "share" | "clipboard" | "none" }>}
 */
export async function shareOrCopyPlainText(text, { title = "CommitTrack" } = {}) {
  const body = String(text || "").trim();
  if (!body) return { ok: false, method: "none" };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text: body });
      return { ok: true, method: "share" };
    } catch (e) {
      if (e && (e.name === "AbortError" || e.name === "NotAllowedError")) {
        return { ok: false, method: "none" };
      }
      /* fall through to clipboard */
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(body);
      return { ok: true, method: "clipboard" };
    } catch {
      /* ignore */
    }
  }

  return { ok: false, method: "none" };
}

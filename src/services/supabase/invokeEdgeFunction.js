import { getSupabaseClient } from "../supabase/auth.js";

const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_RETRIES = 1;
const RETRY_DELAY_MS = 400;

/**
 * Invoke a Supabase edge function with timeout, optional retry, and abort support.
 * Note: supabase-js invoke does not cancel in-flight HTTP when aborted — timeout stops awaiting only.
 * @param {string} functionName
 * @param {{
 *   body?: Record<string, unknown>,
 *   timeoutMs?: number,
 *   retries?: number,
 *   signal?: AbortSignal,
 * }} [options]
 * @returns {Promise<{ data: Record<string, unknown> | null, error: string | null, aborted?: boolean }>}
 */
export async function invokeEdgeFunction(functionName, options = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: "supabase_unavailable" };

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = Math.max(0, options.retries ?? DEFAULT_RETRIES);
  const outerSignal = options.signal;

  let lastError = "request_failed";

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (outerSignal?.aborted) {
      return { data: null, error: "aborted", aborted: true };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const onOuterAbort = () => controller.abort();
    outerSignal?.addEventListener("abort", onOuterAbort, { once: true });

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: options.body ?? {},
      });

      if (controller.signal.aborted || outerSignal?.aborted) {
        return { data: null, error: "timeout", aborted: true };
      }

      if (error) {
        lastError = error.message || String(error);
        if (attempt < retries && isRetryableEdgeError(lastError)) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        return { data: null, error: lastError };
      }

      const out =
        data && typeof data === "object" && !Array.isArray(data)
          ? /** @type {Record<string, unknown>} */ (data)
          : null;
      return { data: out, error: null };
    } catch (e) {
      if (controller.signal.aborted || outerSignal?.aborted) {
        return { data: null, error: "timeout", aborted: true };
      }
      lastError = e instanceof Error ? e.message : String(e);
      if (attempt < retries && isRetryableEdgeError(lastError)) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      return { data: null, error: lastError };
    } finally {
      clearTimeout(timeoutId);
      outerSignal?.removeEventListener("abort", onOuterAbort);
    }
  }

  return { data: null, error: lastError };
}

/** @param {string} message */
function isRetryableEdgeError(message) {
  const m = message.toLowerCase();
  return (
    m.includes("network") ||
    m.includes("fetch") ||
    m.includes("timeout") ||
    m.includes("503") ||
    m.includes("502") ||
    m.includes("504")
  );
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

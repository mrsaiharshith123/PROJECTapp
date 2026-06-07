import { getSupabaseClient } from "../supabase/auth.js";
import { formatAuthError } from "../../utils/authErrors.js";

/**
 * @param {unknown} profile
 * @returns {boolean}
 */
export function isAdminProfile(profile) {
  if (!profile || typeof profile !== "object") return false;
  return /** @type {{ is_admin?: boolean }} */ (profile).is_admin === true;
}

/**
 * Fetch aggregated admin metrics via secured RPC.
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function fetchAdminOverview() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("admin_product_overview");
  if (error) {
    if (error.code === "42501" || error.message?.includes("not_admin")) {
      const err = new Error("NOT_ADMIN");
      /** @type {{ code?: string }} */ (err).code = "NOT_ADMIN";
      throw err;
    }
    throw new Error(formatAuthError(error));
  }
  return data && typeof data === "object" ? data : null;
}

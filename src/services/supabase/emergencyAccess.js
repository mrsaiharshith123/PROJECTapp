import { getSupabaseClient } from "./auth.js";
import { invokeEdgeFunction } from "./invokeEdgeFunction.js";

/**
 * Create a new Emergency Access grant. Returns the raw token exactly once —
 * the caller must show/share it immediately; it can never be recovered
 * later, only revoked and replaced with a new grant.
 * @param {{ trustedPersonName: string, trustedPersonContact?: string }} input
 */
export async function createEmergencyAccessGrant(input) {
  const { data, error } = await invokeEdgeFunction("emergency-access-grant", { body: input });
  if (error) throw new Error(error);
  return data;
}

export async function listEmergencyAccessGrants() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("emergency_access_list_grants");
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/** @param {string} grantId */
export async function revokeEmergencyAccessGrant(grantId) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.rpc("emergency_access_revoke_grant", { p_grant_id: grantId });
  if (error) throw error;
}

/**
 * Token-based view for the trusted person — no Perovo account or sign-in
 * required. Only ever returns the four safe fields, never raw account data.
 * @param {string} token
 */
export async function fetchEmergencyAccessView(token) {
  const { data, error } = await invokeEdgeFunction("emergency-access-view", { body: { token } });
  if (error) throw new Error(error);
  return data;
}

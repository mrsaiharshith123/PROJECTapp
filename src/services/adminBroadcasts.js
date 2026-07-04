import { getSupabaseClient } from "./supabase/auth.js";
import { formatAuthError } from "../utils/authErrors.js";

/**
 * @param {unknown} err
 * @returns {never}
 */
function throwAdminError(err) {
  const e = /** @type {{ code?: string, message?: string }} */ (err);
  if (e?.code === "42501" || e?.message?.includes("not_admin")) {
    const next = new Error("NOT_ADMIN");
    /** @type {{ code?: string }} */ (next).code = "NOT_ADMIN";
    throw next;
  }
  throw new Error(formatAuthError(err));
}

/**
 * @returns {Promise<object[]>}
 */
export async function fetchAdminBroadcasts() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("app_broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throwAdminError(error);
  return data || [];
}

/**
 * @param {{
 *   type: string,
 *   title: string,
 *   body: string,
 *   route?: string | null,
 *   target_tiers?: string[] | null,
 *   active_from?: string,
 *   active_until?: string | null,
 *   created_by?: string | null,
 * }} payload
 */
export async function createAdminBroadcast(payload) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Cloud sync is not configured.");

  const { data, error } = await supabase
    .from("app_broadcasts")
    .insert({
      type: payload.type,
      title: payload.title.trim(),
      body: payload.body.trim(),
      route: payload.route?.trim() || null,
      target_tiers: payload.target_tiers?.length ? payload.target_tiers : null,
      active_from: payload.active_from || new Date().toISOString(),
      active_until: payload.active_until || null,
      created_by: payload.created_by || null,
    })
    .select()
    .single();

  if (error) throwAdminError(error);
  return data;
}

/**
 * @param {string} id
 */
export async function deleteAdminBroadcast(id) {
  const supabase = getSupabaseClient();
  if (!supabase || !id) return;

  const { error } = await supabase.from("app_broadcasts").delete().eq("id", id);
  if (error) throwAdminError(error);
}

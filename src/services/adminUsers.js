import { getSupabaseClient } from "./supabase/auth.js";
import { formatAuthError } from "../utils/authErrors.js";

/**
 * @param {unknown} err
 * @returns {never}
 */
function throwAdminError(err) {
  const e = /** @type {{ code?: string, message?: string }} */ (err);
  if (e?.code === "42501" || e?.message?.includes("not_admin")) {
    const e = new Error("NOT_ADMIN");
    /** @type {{ code?: string }} */ (e).code = "NOT_ADMIN";
    throw e;
  }
  throw new Error(formatAuthError(err));
}

/**
 * @param {{ search?: string, limit?: number, offset?: number }} [opts]
 */
export async function fetchAdminUsers(opts = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return { total: 0, users: [], limit: 50, offset: 0 };

  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: opts.search || "",
    p_limit: opts.limit ?? 50,
    p_offset: opts.offset ?? 0,
  });

  if (error) throwAdminError(error);

  const payload = data && typeof data === "object" ? data : {};
  return {
    total: Number(payload.total) || 0,
    limit: Number(payload.limit) || 50,
    offset: Number(payload.offset) || 0,
    users: Array.isArray(payload.users) ? payload.users : [],
  };
}

/**
 * @param {string} userId
 * @param {Record<string, unknown>} patch
 */
export async function adminUpdateUser(userId, patch) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Cloud sync is not configured.");

  const { data, error } = await supabase.rpc("admin_update_user", {
    p_user_id: userId,
    p_patch: patch,
  });

  if (error) throwAdminError(error);
  return data;
}

/**
 * @param {string} userId
 * @param {boolean} isAdmin
 */
export async function adminSetUserAdmin(userId, isAdmin) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Cloud sync is not configured.");

  const { data, error } = await supabase.rpc("admin_set_user_admin", {
    p_user_id: userId,
    p_is_admin: isAdmin,
  });

  if (error) throwAdminError(error);
  return data;
}

/** @param {string} userId */
export async function adminDeleteUser(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Cloud sync is not configured.");

  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  if (error) throwAdminError(error);
}

/** @param {string} userId @param {boolean} ban */
export async function adminBanUser(userId, ban = true) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Not configured.");
  const { error } = await supabase.rpc("admin_ban_user", { p_user_id: userId, p_ban: ban });
  if (error) throwAdminError(error);
}

/** @param {string} userId */
export async function adminVerifyEmail(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Not configured.");
  const { error } = await supabase.rpc("admin_verify_email", { p_user_id: userId });
  if (error) throwAdminError(error);
}

/** @param {string} userId */
export async function adminRevokeSessions(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Not configured.");
  const { error } = await supabase.rpc("admin_revoke_sessions", { p_user_id: userId });
  if (error) throwAdminError(error);
}

/** @param {string} userId */
export async function adminResetOnboarding(userId) {
  return adminUpdateUser(userId, { onboarding_complete: false });
}

/** Export users to CSV string. */
export async function adminExportUsersCsv() {
  const result = await fetchAdminUsers({ limit: 1000, offset: 0 });
  const rows = result.users;
  const headers = [
    "id",
    "email",
    "display_name",
    "subscription_tier",
    "phone",
    "pan_verified",
    "is_admin",
    "onboarding_complete",
    "created_at",
    "last_active_at",
    "banned_until",
    "email_confirmed_at",
    "subscription_updated_at",
    "razorpay_payment_id",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((u) => headers.map((h) => JSON.stringify(u[h] ?? "")).join(",")),
  ];
  return lines.join("\n");
}

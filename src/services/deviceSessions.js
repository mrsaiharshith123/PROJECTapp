import { getSupabaseClient } from "./supabase/auth.js";
import { getDeviceId, getDeviceLabel } from "./sync/syncMeta.js";
import { getCityLabel } from "../constants/cityLivingCosts.js";

const TABLE = "user_device_sessions";

/**
 * @param {string} userId
 * @param {{ userCity?: string }} [settings]
 */
export async function upsertDeviceSession(userId, settings = {}) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;
  const deviceId = getDeviceId();
  const row = {
    user_id: userId,
    device_id: deviceId,
    device_label: getDeviceLabel(),
    city: settings.userCity ? getCityLabel(settings.userCity) : null,
    region: settings.userCity || null,
    last_active_at: new Date().toISOString(),
    revoked_at: null,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "user_id,device_id" })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function listDeviceSessions(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * @param {string} userId
 * @param {string} deviceId
 */
export async function revokeDeviceSession(userId, deviceId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !deviceId) return;
  const { error } = await supabase
    .from(TABLE)
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("device_id", deviceId);
  if (error) throw error;
}

/**
 * @param {string} userId
 */
export async function revokeAllOtherDeviceSessions(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return;
  const current = getDeviceId();
  const { error } = await supabase
    .from(TABLE)
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .neq("device_id", current)
    .is("revoked_at", null);
  if (error) throw error;
}

/**
 * @param {string} userId
 */
export async function isCurrentDeviceRevoked(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;
  const { data, error } = await supabase
    .from(TABLE)
    .select("revoked_at")
    .eq("user_id", userId)
    .eq("device_id", getDeviceId())
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.revoked_at);
}

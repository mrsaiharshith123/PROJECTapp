import { getSupabaseClient } from "./supabase/auth.js";
import { getDeviceId } from "./sync/syncMeta.js";
import { getCityLabel } from "../constants/cityLivingCosts.js";
import {
  dedupeSessionRows,
  findStaleSessionDeviceIds,
  getDeviceInfo,
  refineDeviceInfoAsync,
} from "../utils/deviceInfo.js";

const TABLE = "user_device_sessions";

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
async function fetchDeviceSessionsRaw(userId) {
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
 * Revoke duplicate rows for the same OS + browser (e.g. after localStorage resets).
 * @param {string} userId
 * @param {object[]} rows
 */
async function pruneStaleDuplicateSessions(userId, rows) {
  const staleIds = findStaleSessionDeviceIds(rows, getDeviceId());
  for (const deviceId of staleIds) {
    await revokeDeviceSession(userId, deviceId);
  }
}

/**
 * @param {string} userId
 * @param {{ userCity?: string }} [settings]
 */
export async function upsertDeviceSession(userId, settings = {}) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;
  const deviceId = getDeviceId();

  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("device_id", deviceId)
    .maybeSingle();

  const isNewDevice = !existing;
  const info = await refineAndGetDeviceInfo();
  const row = {
    user_id: userId,
    device_id: deviceId,
    device_label: info.label,
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

  if (isNewDevice) {
    await supabase
      .from("user_notifications")
      .insert({
        user_id: userId,
        type: "security",
        title: "New sign-in detected",
        body: "A new device signed into your Perovo account. If this wasn't you, go to Security settings.",
        route: "/you/security",
      })
      .catch(() => {});
  }

  try {
    const all = await fetchDeviceSessionsRaw(userId);
    await pruneStaleDuplicateSessions(userId, all);
  } catch {
    /* non-fatal */
  }

  return data;
}

async function refineAndGetDeviceInfo() {
  return refineDeviceInfoAsync(getDeviceInfo());
}

/**
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function listDeviceSessions(userId) {
  const rows = await fetchDeviceSessionsRaw(userId);
  return dedupeSessionRows(rows, getDeviceId());
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
  const rows = await fetchDeviceSessionsRaw(userId);
  const visible = dedupeSessionRows(rows, current);
  const staleIds = findStaleSessionDeviceIds(rows, current);
  const revokeIds = new Set(staleIds);

  for (const row of visible) {
    if (row.device_id !== current) revokeIds.add(row.device_id);
  }

  for (const deviceId of revokeIds) {
    await revokeDeviceSession(userId, deviceId);
  }
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

import { getSupabaseClient } from "../supabase/auth.js";
import { isNativeCapacitorShell } from "../../utils/nativePermissions.js";
import { log } from "../../utils/logger.js";

const TABLE = "user_push_tokens";

/**
 * @param {string} userId
 * @param {{ token: string, platform: string }} row
 */
export async function savePushToken(userId, { token, platform }) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !token) return { ok: false, reason: "missing" };

  try {
    const { error } = await supabase.from(TABLE).upsert(
      {
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" },
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    log.auth.warn("Push token save failed", { message: err instanceof Error ? err.message : String(err) });
    return { ok: false, reason: "save_failed" };
  }
}

/**
 * @param {string} userId
 * @param {string} token
 */
export async function removePushToken(userId, token) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !token) return;
  try {
    const { error } = await supabase.from(TABLE).delete().eq("user_id", userId).eq("token", token);
    if (error) throw error;
  } catch {
    /* non-fatal */
  }
}

export function isPushConfigured() {
  if (isNativeCapacitorShell()) return true;
  return Boolean(import.meta.env.VITE_FIREBASE_VAPID_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);
}

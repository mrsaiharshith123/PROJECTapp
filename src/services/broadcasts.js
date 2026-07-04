import { getSupabaseClient } from "./supabase/auth.js";

/**
 * Fetch active broadcasts not yet dismissed by this user.
 * @param {string} userId
 * @param {string} [userTier]
 * @returns {Promise<Array>}
 */
export async function fetchActiveBroadcasts(userId, userTier = "free") {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return [];

  try {
    const { data: dismissals } = await supabase
      .from("user_broadcast_dismissals")
      .select("broadcast_id")
      .eq("user_id", userId);

    const dismissedIds = (dismissals || []).map((d) => d.broadcast_id);

    let query = supabase
      .from("app_broadcasts")
      .select("*")
      .lte("active_from", new Date().toISOString())
      .or(`active_until.is.null,active_until.gt.${new Date().toISOString()}`)
      .order("active_from", { ascending: false });

    if (dismissedIds.length > 0) {
      query = query.not("id", "in", `(${dismissedIds.join(",")})`);
    }

    const { data, error } = await query;
    if (error) return [];

    return (data || []).filter((b) => {
      if (!b.target_tiers || b.target_tiers.length === 0) return true;
      return b.target_tiers.includes(userTier);
    });
  } catch {
    return [];
  }
}

/**
 * Fetch unread user-specific notifications (e.g. security alerts).
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchUserNotifications(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * @param {string} userId
 * @param {string} broadcastId
 */
export async function dismissBroadcast(userId, broadcastId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !broadcastId) return;
  await supabase
    .from("user_broadcast_dismissals")
    .upsert({ user_id: userId, broadcast_id: broadcastId })
    .throwOnError()
    .catch(() => {});
}

/**
 * @param {string} userId
 * @param {string} notificationId
 */
export async function markUserNotificationRead(userId, notificationId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !notificationId) return;
  await supabase
    .from("user_notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("id", notificationId)
    .throwOnError()
    .catch(() => {});
}

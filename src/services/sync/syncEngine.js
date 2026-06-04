import { buildAppSnapshot } from "../../storage/appSnapshot.js";
import { getSupabaseClient } from "../supabase/auth.js";
import { recordAccountActivity } from "../accountActivity.js";
import { log } from "../../utils/logger.js";
import { SYNC_TABLE, SYNC_MIN_PUSH_INTERVAL_MS } from "./constants.js";
import { loadSyncMeta, saveSyncMeta } from "./syncMeta.js";

let pushTimer = null;
let pushInFlight = false;
let skipNextPush = false;

/**
 * @returns {Promise<{ payload: object, updatedAt: string, snapshotVersion: number } | null>}
 */
async function fetchRemoteSnapshot(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from(SYNC_TABLE)
    .select("payload, updated_at, snapshot_version")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return {
    payload: data.payload,
    updatedAt: data.updated_at,
    snapshotVersion: Number(data.snapshot_version) || 1,
  };
}

/**
 * @param {string} userId
 * @param {object} payload
 * @param {{ deviceId?: string, snapshotVersion?: number }} meta
 */
async function upsertRemoteSnapshot(userId, payload, meta = {}) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) throw new Error("Cloud sync is not available.");
  const row = {
    user_id: userId,
    payload,
    snapshot_version: meta.snapshotVersion ?? 1,
    device_id: meta.deviceId ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(SYNC_TABLE)
    .upsert(row, { onConflict: "user_id" })
    .select("updated_at")
    .single();
  if (error) throw error;
  return data?.updated_at ?? row.updated_at;
}

export function isCloudSyncConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/** @param {import('../../types/context.js').AuthProfile | undefined} settings @param {boolean} isLoggedIn */
export function canUseCloudSync(settings, isLoggedIn) {
  if (!isLoggedIn || !isCloudSyncConfigured()) return false;
  return Boolean(settings?.cloudSyncEnabled) || settings?.subscriptionTier === "power";
}

/**
 * @param {{
 *   userId: string,
 *   getState: () => { commitments, lendings, settings, goals, monthlySnapshots, businessInvoices },
 * }} ctx
 */
export async function pushLocalSnapshotToCloud(ctx) {
  if (pushInFlight) return { ok: false, reason: "busy" };
  pushInFlight = true;
  try {
    const state = ctx.getState();
    if (!canUseCloudSync(state.settings, true)) return { ok: false, reason: "disabled" };

    const meta = loadSyncMeta();
    if (meta.lastPushedAt) {
      const elapsed = Date.now() - new Date(meta.lastPushedAt).getTime();
      if (elapsed < SYNC_MIN_PUSH_INTERVAL_MS) return { ok: false, reason: "throttled" };
    }

    const payload = buildAppSnapshot(state);
    const updatedAt = await upsertRemoteSnapshot(ctx.userId, payload, {
      deviceId: meta.deviceId,
      snapshotVersion: payload.schemaVersion,
    });
    saveSyncMeta({
      userId: ctx.userId,
      lastPushedAt: new Date().toISOString(),
      remoteUpdatedAt: updatedAt,
      pendingPush: false,
    });
    log.sync.info("Cloud backup saved", { userId: ctx.userId });
    recordAccountActivity({ type: "sync_push", level: "success", message: "Cloud backup saved" });
    return { ok: true, updatedAt };
  } catch (err) {
    log.sync.error("Cloud push failed", { message: err instanceof Error ? err.message : String(err) });
    recordAccountActivity({
      type: "sync_error",
      level: "error",
      message: "Cloud backup failed",
      detail: err instanceof Error ? err.message : undefined,
    });
    throw err;
  } finally {
    pushInFlight = false;
  }
}

/**
 * @param {{
 *   userId: string,
 *   getState: () => { commitments, lendings, settings, goals, monthlySnapshots, businessInvoices },
 *   applySnapshot: (payload: object, options: { mode: string }) => unknown,
 *   preferLocal?: boolean,
 * }} ctx
 */
export async function pullRemoteSnapshotToLocal(ctx) {
  const remote = await fetchRemoteSnapshot(ctx.userId);
  if (!remote?.payload) return { ok: false, reason: "empty" };

  const meta = loadSyncMeta();
  const localPushed = meta.lastPushedAt ? new Date(meta.lastPushedAt).getTime() : 0;
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (ctx.preferLocal && localPushed >= remoteTime) {
    return { ok: false, reason: "local-newer" };
  }

  skipNextPush = true;
  try {
    const summary = ctx.applySnapshot(remote.payload, { mode: "replace" });
    saveSyncMeta({
      userId: ctx.userId,
      lastPulledAt: new Date().toISOString(),
      remoteUpdatedAt: remote.updatedAt,
      pendingPush: false,
    });
    log.sync.info("Cloud restore applied", { userId: ctx.userId });
    recordAccountActivity({ type: "sync_pull", level: "success", message: "Restored from cloud" });
    return { ok: true, summary, updatedAt: remote.updatedAt };
  } catch (err) {
    log.sync.error("Cloud pull failed", { message: err instanceof Error ? err.message : String(err) });
    recordAccountActivity({
      type: "sync_error",
      level: "error",
      message: "Cloud restore failed",
      detail: err instanceof Error ? err.message : undefined,
    });
    throw err;
  } finally {
    setTimeout(() => {
      skipNextPush = false;
    }, 500);
  }
}

export function shouldSkipAutoPush() {
  return skipNextPush;
}

/**
 * @param {{ userId: string, getState: () => object, applySnapshot: Function }} ctx
 */
export function scheduleCloudPush(ctx) {
  if (shouldSkipAutoPush()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushLocalSnapshotToCloud(ctx).catch((err) => {
      log.sync.warn("Scheduled push failed", { message: err instanceof Error ? err.message : String(err) });
      saveSyncMeta({ pendingPush: true });
    });
  }, 4000);
}

export function cancelScheduledCloudPush() {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

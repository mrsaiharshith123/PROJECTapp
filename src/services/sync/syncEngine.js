import { buildAppSnapshot } from "../../storage/appSnapshot.js";
import { localStateHasUserData, snapshotDataCounts, snapshotHasUserData } from "../../storage/snapshotData.js";
import { getSupabaseClient } from "../supabase/auth.js";
import { hasPaidBackupTier } from "../../constants/subscriptionTiers.js";
import { log } from "../../utils/logger.js";
import { SYNC_TABLE, SYNC_MIN_PUSH_INTERVAL_MS } from "./constants.js";
import { appendBackupLog, getDeviceLabel, loadSyncMeta, saveSyncMeta } from "./syncMeta.js";

let pushTimer = null;
let pushInFlight = false;
let skipNextPush = false;

/**
 * @returns {Promise<{ payload: object, updatedAt: string, snapshotVersion: number, deviceId: string | null } | null>}
 */
async function fetchRemoteSnapshot(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from(SYNC_TABLE)
    .select("payload, updated_at, snapshot_version, device_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.payload) return null;
  return {
    payload: data.payload,
    updatedAt: data.updated_at,
    snapshotVersion: Number(data.snapshot_version) || 1,
    deviceId: data.device_id ?? null,
  };
}

/** @param {string} userId */
export async function fetchRemoteBackupMeta(userId) {
  const remote = await fetchRemoteSnapshot(userId);
  if (!remote) return null;
  const counts = snapshotDataCounts(remote.payload);
  return {
    updatedAt: remote.updatedAt,
    deviceId: remote.deviceId,
    counts,
    hasData: snapshotHasUserData(remote.payload),
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

/**
 * Supabase account backup: Pro/Power + enabled + signed in.
 * @param {import('../../types/context.js').AppSettings | undefined} settings
 * @param {boolean} isLoggedIn
 */
export function canUseAccountBackup(settings, isLoggedIn) {
  if (!isLoggedIn || !isCloudSyncConfigured()) return false;
  if (!hasPaidBackupTier(settings)) return false;
  return Boolean(settings?.cloudSyncEnabled);
}

export function canUseCloudSync(settings, isLoggedIn) {
  return canUseAccountBackup(settings, isLoggedIn);
}

/**
 * @param {{
 *   userId: string,
 *   getState: () => { commitments, lendings, settings, goals, monthlySnapshots },
 * }} ctx
 */
export async function pushLocalSnapshotToCloud(ctx) {
  if (pushInFlight) return { ok: false, reason: "busy" };
  pushInFlight = true;
  try {
    const state = ctx.getState();
    if (!canUseAccountBackup(state.settings, true)) return { ok: false, reason: "disabled" };

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
    const pushedAt = new Date().toISOString();
    saveSyncMeta({
      userId: ctx.userId,
      lastPushedAt: pushedAt,
      remoteUpdatedAt: updatedAt,
      pendingPush: false,
      deviceLabel: getDeviceLabel(),
    });
    appendBackupLog({
      type: "push",
      at: pushedAt,
      counts: snapshotDataCounts(payload),
    });
    log.sync.info("Cloud backup saved", { userId: ctx.userId });
    return { ok: true, updatedAt };
  } catch (err) {
    log.sync.error("Cloud push failed", { message: err instanceof Error ? err.message : String(err) });
    throw err;
  } finally {
    pushInFlight = false;
  }
}

/**
 * @param {{
 *   userId: string,
 *   getState: () => { commitments, lendings, settings, goals, monthlySnapshots },
 *   applySnapshot: (payload: object, options: { mode: string }) => unknown,
 *   preferLocal?: boolean,
 *   force?: boolean,
 * }} ctx
 */
export async function pullRemoteSnapshotToLocal(ctx) {
  const remote = await fetchRemoteSnapshot(ctx.userId);
  if (!remote?.payload) return { ok: false, reason: "empty" };

  const localState = ctx.getState();
  const localHasData = localStateHasUserData(localState);
  const remoteHasData = snapshotHasUserData(remote.payload);

  if (!remoteHasData && localHasData && !ctx.force) {
    return { ok: false, reason: "remote-empty" };
  }

  const meta = loadSyncMeta();
  const localPushed = meta.lastPushedAt ? new Date(meta.lastPushedAt).getTime() : 0;
  const remoteTime = new Date(remote.updatedAt).getTime();

  if (ctx.preferLocal && localPushed >= remoteTime && !ctx.force) {
    return { ok: false, reason: "local-newer" };
  }

  skipNextPush = true;
  try {
    const summary = ctx.applySnapshot(remote.payload, { mode: "replace" });
    const pulledAt = new Date().toISOString();
    saveSyncMeta({
      userId: ctx.userId,
      lastPulledAt: pulledAt,
      remoteUpdatedAt: remote.updatedAt,
      pendingPush: false,
    });
    appendBackupLog({
      type: "restore",
      at: pulledAt,
      remoteDeviceId: remote.deviceId || undefined,
      counts: snapshotDataCounts(remote.payload),
    });
    log.sync.info("Cloud restore applied", { userId: ctx.userId });
    return { ok: true, summary, updatedAt: remote.updatedAt, deviceId: remote.deviceId };
  } catch (err) {
    log.sync.error("Cloud pull failed", { message: err instanceof Error ? err.message : String(err) });
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

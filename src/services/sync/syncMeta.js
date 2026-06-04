import { STORAGE_KEYS } from "../../storage/keys.js";

const DEVICE_KEY = "committrack_device_id";

function readDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `dev_${crypto.randomUUID?.() || Date.now()}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "dev_unknown";
  }
}

/** @typedef {{ userId?: string, lastPushedAt?: string, lastPulledAt?: string, remoteUpdatedAt?: string, pendingPush?: boolean, deviceId?: string }} SyncMeta */

/** @returns {SyncMeta} */
export function loadSyncMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.syncMeta);
    if (!raw) return { deviceId: readDeviceId() };
    const o = JSON.parse(raw);
    return { deviceId: readDeviceId(), ...(typeof o === "object" && o ? o : {}) };
  } catch {
    return { deviceId: readDeviceId() };
  }
}

/** @param {Partial<SyncMeta>} patch */
export function saveSyncMeta(patch) {
  const next = { ...loadSyncMeta(), ...patch, deviceId: readDeviceId() };
  try {
    localStorage.setItem(STORAGE_KEYS.syncMeta, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function getDeviceId() {
  return readDeviceId();
}

export function clearSyncMetaForUser() {
  saveSyncMeta({ userId: undefined, lastPushedAt: undefined, lastPulledAt: undefined, remoteUpdatedAt: undefined, pendingPush: false });
}

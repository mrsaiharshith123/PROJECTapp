import { STORAGE_KEYS } from "../../storage/keys.js";
import { getDeviceInfo, refineDeviceInfoAsync } from "../../utils/deviceInfo.js";

const DEVICE_KEY = "perovo_device_id";

function readDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.syncMeta);
        const meta = raw ? JSON.parse(raw) : null;
        if (meta?.deviceId) id = meta.deviceId;
      } catch {
        /* ignore */
      }
    }
    if (!id) {
      id = `dev_${crypto.randomUUID?.() || Date.now()}`;
    }
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return "dev_unknown";
  }
}

/** @typedef {{ type: 'push' | 'restore', at: string, deviceId: string, deviceLabel: string, remoteDeviceId?: string, counts?: { bills: number, lending: number, goals: number, spends: number } }} BackupLogEntry */

/** @typedef {{ userId?: string, lastPushedAt?: string, lastPulledAt?: string, remoteUpdatedAt?: string, pendingPush?: boolean, deviceId?: string, deviceLabel?: string, lastDailyPushDate?: string, lastAutoRestoreAt?: string, cloudBackupEnabled?: boolean, backupLog?: BackupLogEntry[] }} SyncMeta */

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

/** @returns {string} */
export function getDeviceLabel() {
  const { label } = getDeviceInfo();
  saveSyncMeta({ deviceLabel: label });
  return label;
}

/** Rich label with Client Hints when available (Windows 11, full Chrome build). */
export async function getDeviceLabelAsync() {
  const refined = await refineDeviceInfoAsync(getDeviceInfo());
  saveSyncMeta({ deviceLabel: refined.label });
  return refined.label;
}

/** @param {Omit<BackupLogEntry, 'deviceId' | 'deviceLabel'> & Partial<Pick<BackupLogEntry, 'deviceId' | 'deviceLabel'>>} entry */
export function appendBackupLog(entry) {
  const meta = loadSyncMeta();
  const row = {
    deviceId: entry.deviceId || meta.deviceId || readDeviceId(),
    deviceLabel: entry.deviceLabel || meta.deviceLabel || getDeviceLabel(),
    type: entry.type,
    at: entry.at,
    remoteDeviceId: entry.remoteDeviceId,
    counts: entry.counts,
  };
  const log = [row, ...(meta.backupLog || [])].slice(0, 25);
  saveSyncMeta({ backupLog: log });
  return log;
}

/** @returns {BackupLogEntry[]} */
export function loadBackupLog() {
  return loadSyncMeta().backupLog || [];
}

export function clearSyncMetaForUser() {
  saveSyncMeta({ userId: undefined, lastPushedAt: undefined, lastPulledAt: undefined, remoteUpdatedAt: undefined, pendingPush: false });
}

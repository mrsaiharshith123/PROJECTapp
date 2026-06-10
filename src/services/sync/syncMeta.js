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

/** @typedef {{ type: 'push' | 'restore', at: string, deviceId: string, deviceLabel: string, remoteDeviceId?: string, counts?: { bills: number, lending: number, goals: number, spends: number } }} BackupLogEntry */

/** @typedef {{ userId?: string, lastPushedAt?: string, lastPulledAt?: string, remoteUpdatedAt?: string, pendingPush?: boolean, deviceId?: string, deviceLabel?: string, backupLog?: BackupLogEntry[] }} SyncMeta */

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
  const meta = loadSyncMeta();
  if (meta.deviceLabel) return meta.deviceLabel;
  let label = "This device";
  try {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad/i.test(ua)) label = "iPhone / iPad";
    else if (/Android/i.test(ua)) label = "Android";
    else if (/Windows/i.test(ua)) label = "Windows";
    else if (/Mac/i.test(ua)) label = "Mac";
    else if (/Linux/i.test(ua)) label = "Linux";
    const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
    if (browser) label = `${label} · ${browser}`;
  } catch {
    /* ignore */
  }
  saveSyncMeta({ deviceLabel: label });
  return label;
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

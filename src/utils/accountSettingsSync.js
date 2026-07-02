/**
 * Account-level settings synced to the user's cloud profile for all signed-in users.
 * Device-local preferences (backup toggle, active profile, layout) stay on this device.
 */

/** @type {(keyof import('../types/context.js').AppSettings)[]} */
export const ACCOUNT_SETTINGS_SYNC_KEYS = [
  "displayName",
  "phoneNumber",
  "monthlyIncome",
  "incomeEntryBasis",
  "userMode",
  "userCity",
  "dependents",
  "profiles",
  "onboardingComplete",
  "appGuideComplete",
  "appLanguage",
  "liquidSavings",
  "goldRatePerGram",
  "goldRateLastFetched",
  "salaryCreditDay",
  "goalAutoSaveRules",
];

/** Keys that must never be overwritten from the server — device-local only. */
export const DEVICE_LOCAL_SETTINGS_KEYS = new Set([
  "cloudSyncEnabled",
  "activeProfileId",
  "dashboardToolOrderByMode",
  "homeQuickActionOrder",
  "readNotificationIds",
  "colorScheme",
  "avatarSource",
  "profileImageDataUrl",
  "remindersEnabled",
  "goalAutoSaveLastRun",
  "subscriptionTier",
  "savedTowardGoals",
  "accountCreatedAt",
]);

/**
 * @param {Record<string, unknown>} settings
 */
export function pickAccountSettingsForServer(settings) {
  /** @type {Record<string, unknown>} */
  const out = { updatedAt: settings.updatedAt || new Date().toISOString() };
  for (const key of ACCOUNT_SETTINGS_SYNC_KEYS) {
    if (key in settings) out[key] = settings[key];
  }
  return out;
}

/**
 * @param {unknown} a
 * @param {unknown} b
 */
function valuesEqual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

/**
 * @param {unknown} value
 */
function isEmptyAccountValue(value) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return value === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "boolean") return false;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Merge account fields from server without clobbering device-local preferences.
 * @param {Record<string, unknown>} local
 * @param {Record<string, unknown>} server
 */
export function mergeAccountSettingsFromServer(local, server) {
  if (!server || typeof server !== "object") return local;
  const localTs = local.updatedAt ? Date.parse(String(local.updatedAt)) : 0;
  const serverTs = server.updatedAt ? Date.parse(String(server.updatedAt)) : 0;
  if (!serverTs || serverTs <= localTs) return local;

  /** @type {Record<string, unknown>} */
  const next = { ...local };
  let changed = false;
  for (const key of ACCOUNT_SETTINGS_SYNC_KEYS) {
    if (!(key in server)) continue;
    const before = local[key];
    const after = server[key];
    if (isEmptyAccountValue(after) && !isEmptyAccountValue(before)) continue;
    if (!valuesEqual(before, after)) {
      next[key] = after;
      changed = true;
    }
  }
  if (!changed) return local;
  next.updatedAt = server.updatedAt;
  return next;
}

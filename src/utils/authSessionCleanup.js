import { invalidateInitialAppStateCache, loadSettingsFromStorage } from "./migrateStorage.js";
import { STORAGE_KEYS } from "./storage/keys.js";
import { emitLocalDataChanged, emitSettingsReset } from "./storage/events.js";

/** @see AuthGatePage - skip server profile check right after signup */
export const SIGNUP_PENDING_KEY = "perovo_signup_pending";

export class ProfilesTableMissingError extends Error {
  constructor() {
    super("profiles_table_missing");
    this.name = "ProfilesTableMissingError";
    this.code = "42P01";
  }
}

export function markSignupPending() {
  try {
    sessionStorage.setItem(SIGNUP_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSignupPending() {
  try {
    sessionStorage.removeItem(SIGNUP_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function isSignupPending() {
  try {
    return sessionStorage.getItem(SIGNUP_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearAccountSeedKeys(userId) {
  if (!userId) return;
  try {
    localStorage.removeItem(`perovo_auth_seeded_${userId}`);
    localStorage.removeItem(`perovo_profile_seeded_${userId}`);
  } catch {
    /* ignore */
  }
}

/**
 * Wipe financial/sensitive local data on sign-out so the app shows nothing
 * without re-authenticating (shared/resold-device leak fix). Only non-sensitive
 * device preferences (color scheme, app language) survive sign-out; everything
 * else — commitments, lendings, snapshots, goals, wealth entries, income, PAN,
 * phone, city, EPF figures — is cleared. A subsequent sign-in restores from
 * the cloud backup (if the account has one) rather than trusting stale local state.
 */
export function resetLocalAccountFlags() {
  try {
    localStorage.removeItem(STORAGE_KEYS.commitments);
    localStorage.removeItem(STORAGE_KEYS.lendings);
    localStorage.removeItem(STORAGE_KEYS.monthlySnapshots);
    localStorage.removeItem(STORAGE_KEYS.goals);
    localStorage.removeItem(STORAGE_KEYS.wealth);
    localStorage.removeItem(STORAGE_KEYS.syncMeta);

    const defaults = loadSettingsFromStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    const prev = raw ? JSON.parse(raw) : {};
    const next = {
      ...defaults,
      colorScheme: prev.colorScheme ?? defaults.colorScheme,
      appLanguage: prev.appLanguage ?? defaults.appLanguage,
      onboardingComplete: false,
      cloudSyncEnabled: false,
      appGuideComplete: defaults.appGuideComplete ?? false,
    };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
    invalidateInitialAppStateCache();
    emitLocalDataChanged();
    emitSettingsReset();
  } catch {
    /* ignore */
  }
}

export function isProfilesTableMissingError(err) {
  if (err instanceof ProfilesTableMissingError) return true;
  const code = err?.code || "";
  const msg = String(err?.message || "");
  return code === "42P01" || code === "PGRST205" || /profiles.*does not exist/i.test(msg);
}

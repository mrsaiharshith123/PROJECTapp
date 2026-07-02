import { invalidateInitialAppStateCache, loadSettingsFromStorage } from "./migrateStorage.js";
import { STORAGE_KEYS } from "./storage/keys.js";
import { emitSettingsReset } from "./storage/events.js";

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

/** Clear account fields so a wiped server row cannot unlock the app from local cache. */
export function resetLocalAccountFlags() {
  try {
    const defaults = loadSettingsFromStorage();
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    const prev = raw ? JSON.parse(raw) : {};
    const next = {
      ...prev,
      displayName: "",
      phoneNumber: "",
      monthlyIncome: 0,
      onboardingComplete: false,
      cloudSyncEnabled: false,
      appGuideComplete: defaults.appGuideComplete ?? false,
    };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
    invalidateInitialAppStateCache();
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

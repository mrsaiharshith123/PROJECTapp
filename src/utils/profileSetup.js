import { isValidIndianPhone, normalizeIndianPhone } from "./phone.js";

/**
 * Server `profiles` row must exist and be complete (not local-only).
 * @param {Record<string, unknown> | null | undefined} profile
 * @param {string | undefined} userId
 */
export function isServerProfileReady(profile, userId) {
  if (!profile || !userId || String(profile.id) !== String(userId)) return false;
  const name = String(profile.display_name || profile.username || "").trim();
  const income = Number(profile.monthly_income) > 0;
  const phone = isValidIndianPhone(profile.phone || "");
  return Boolean(name && income && phone && profile.onboarding_complete === true);
}

/**
 * @param {import('../types/context.js').AppSettings | undefined} settings
 * @param {Record<string, unknown> | null | undefined} profile
 * @param {string | undefined} userId
 */
export function isAccountSetupComplete(settings, profile, userId) {
  if (!userId) return false;
  return isServerProfileReady(profile, userId);
}

/** Field checks for onboarding steps (does not require onboarding_complete on server yet). */
export function validateOnboardingFields(settings, profile, userId) {
  if (!userId) return "Sign in to continue.";
  const name = String(settings?.displayName || profile?.display_name || "").trim();
  const income =
    Number(settings?.monthlyIncome) > 0 || Number(profile?.monthly_income) > 0;
  const phone = normalizeIndianPhone(settings?.phoneNumber || profile?.phone || "");
  if (!name) return "Your name is required.";
  if (!income) return "Monthly salary is required.";
  if (!isValidIndianPhone(phone)) return "A valid 10-digit mobile number is required.";
  return null;
}

export function setupIncompleteMessage(settings, profile, userId) {
  if (!userId) return "Sign in to continue.";
  if (!profile) return "No account record on the server — create your account again.";
  if (!isServerProfileReady(profile, userId)) {
    const name = String(profile.display_name || profile.username || "").trim();
    const income = Number(profile.monthly_income) > 0;
    const phone = isValidIndianPhone(profile.phone || "");
    if (!name) return "Your name is required on your account.";
    if (!income) return "Monthly salary is required on your account.";
    if (!isValidIndianPhone(phone)) return "A valid mobile number is required on your account.";
    if (!profile.onboarding_complete) return "Finish account setup to continue.";
  }
  return null;
}

/** @deprecated Use isServerProfileReady — kept for tests importing phone helpers context */
export function hasLocalProfileFields(settings, profile) {
  const name = String(settings?.displayName || profile?.display_name || "").trim();
  const income =
    Number(settings?.monthlyIncome) > 0 || Number(profile?.monthly_income) > 0;
  const phone = normalizeIndianPhone(settings?.phoneNumber || profile?.phone || "");
  return Boolean(name && income && isValidIndianPhone(phone));
}

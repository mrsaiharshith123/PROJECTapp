/**
 * Human-readable auth / account errors from Supabase and network failures.
 * @param {unknown} err
 */
export function formatAuthError(err) {
  if (!err) return "Something went wrong. Please try again.";

  const msg =
    (err instanceof Error ? err.message : null) ||
    (typeof err === "object" && err && "message" in err ? String(/** @type {{ message?: string }} */ (err).message) : null) ||
    String(err);

  const code =
    typeof err === "object" && err && "code" in err ? String(/** @type {{ code?: string }} */ (err).code) : "";
  const status =
    typeof err === "object" && err && "status" in err ? Number(/** @type {{ status?: number }} */ (err).status) : 0;

  const lower = msg.toLowerCase();

  if (lower.includes("invalid login credentials") || code === "invalid_credentials") {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists — try signing in.";
  }
  if (lower.includes("password") && (lower.includes("short") || lower.includes("least"))) {
    return "Password does not meet security requirements.";
  }
  if (lower.includes("rate limit") || status === 429) {
    return "Too many attempts — wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch")) {
    return "Network issue — check your connection and try again.";
  }
  if (lower.includes("not configured") || lower.includes("supabase")) {
    return "Cloud account is not available in this build.";
  }
  if (lower.includes("infinite recursion") && lower.includes("policy")) {
    return "Account security policy error — run supabase/migrations/20260606010000_fix_admin_rls_recursion.sql in Supabase SQL Editor.";
  }
  if (code === "42703") {
    return "Profile saved with basic fields only — run latest database migration for full profile sync.";
  }
  if (code === "NO_AUTH_SESSION" || lower.includes("no_auth_session")) {
    return "Account created. Confirm your email if required, then sign in to finish setup.";
  }
  if (
    code === "42501" ||
    lower.includes("row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("violates row-level")
  ) {
    return "Could not save your profile in Supabase. In the SQL editor, run supabase/migrations/ (especially 20260604150000_profiles.sql and 20260604180000_profiles_signup_trigger.sql), then try again.";
  }

  return msg.length > 120 ? `${msg.slice(0, 117)}…` : msg;
}

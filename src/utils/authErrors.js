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
  if (code === "42703") {
    return "Profile saved with basic fields only — run latest database migration for full profile sync.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Account permission issue — sign out and in again, or contact support.";
  }

  return msg.length > 120 ? `${msg.slice(0, 117)}…` : msg;
}

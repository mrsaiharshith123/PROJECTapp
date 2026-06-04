import { createClient } from "@supabase/supabase-js";
import { normalizePan } from "../../utils/pan.js";
import { log } from "../../utils/logger.js";
import { formatAuthError } from "../../utils/authErrors.js";
import { ProfilesTableMissingError } from "../../utils/authSessionCleanup.js";

/**
 * Build a full profiles row for upsert — never null-out fields omitted from patch.
 * @param {string} userId
 * @param {Record<string, unknown> | null | undefined} existing
 * @param {Record<string, unknown>} patch
 */
export function buildProfileUpsertPayload(userId, existing, patch) {
  const ex = existing && typeof existing === "object" ? existing : {};
  const p = patch && typeof patch === "object" ? patch : {};

  const username =
    p.username !== undefined
      ? String(p.username ?? "").trim()
      : String(ex.username ?? ex.display_name ?? "").trim();

  const displayName =
    p.display_name !== undefined
      ? String(p.display_name ?? p.username ?? "").trim()
      : String(ex.display_name ?? ex.username ?? "").trim();

  const panRaw = p.pan !== undefined ? p.pan : ex.pan;
  const pan = panRaw ? normalizePan(panRaw) : null;

  const monthlyIncome =
    p.monthly_income !== undefined
      ? Math.max(0, Number(p.monthly_income) || 0)
      : Math.max(0, Number(ex.monthly_income) || 0);

  const phone =
    p.phone !== undefined
      ? p.phone
        ? String(p.phone).trim()
        : null
      : ex.phone
        ? String(ex.phone).trim()
        : null;

  const userMode =
    p.user_mode !== undefined && p.user_mode != null
      ? String(p.user_mode)
      : ex.user_mode
        ? String(ex.user_mode)
        : null;

  const householdScope =
    p.household_scope !== undefined && p.household_scope != null
      ? String(p.household_scope)
      : ex.household_scope
        ? String(ex.household_scope)
        : null;

  const onboardingComplete =
    p.onboarding_complete !== undefined
      ? Boolean(p.onboarding_complete)
      : Boolean(ex.onboarding_complete);

  const panVerified =
    p.pan_verified !== undefined ? Boolean(p.pan_verified) : Boolean(ex.pan_verified);

  return {
    id: userId,
    username,
    display_name: displayName || username,
    pan,
    pan_verified: panVerified,
    pan_updated_at: new Date().toISOString(),
    user_mode: userMode,
    household_scope: householdScope,
    monthly_income: monthlyIncome,
    onboarding_complete: onboardingComplete,
    phone,
  };
}

let supabaseSingleton = null;

function throwAuth(err, context) {
  log.auth.error(context, { code: err?.code, status: err?.status });
  throw new Error(formatAuthError(err));
}

export function getSupabaseClient() {
  if (supabaseSingleton) return supabaseSingleton;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    log.auth.warn("Supabase client not configured");
    return null;
  }
  supabaseSingleton = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  log.auth.info("Supabase client initialized");
  return supabaseSingleton;
}

const PROFILE_TABLE = "profiles";

/**
 * Validates JWT with Supabase (not just cached localStorage).
 * Deleted auth users are signed out locally automatically.
 */
export async function getAuthSession() {
  const supabase = getSupabaseClient();
  if (!supabase) return { session: null, user: null };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    log.auth.warn("No valid server user — clearing local session", {
      message: userError?.message,
    });
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      /* ignore */
    }
    return { session: null, user: null };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throwAuth(error, "Could not read session");
  log.auth.debug("Session loaded", { hasSession: Boolean(data.session) });
  return { session: data.session, user: userData.user };
}

export async function signUpWithEmail(email, password, metadata = null) {
  const supabase = getSupabaseClient();
  if (!supabase) throwAuth(new Error("Supabase is not configured."), "Sign up");
  log.auth.info("Sign up attempt");
  const options = metadata && typeof metadata === "object" ? { data: metadata } : undefined;
  const { data, error } = await supabase.auth.signUp({ email, password, options });
  if (error) throwAuth(error, "Sign up failed");
  return data;
}

export async function signInWithEmail(email, password) {
  const supabase = getSupabaseClient();
  if (!supabase) throwAuth(new Error("Supabase is not configured."), "Sign in");
  log.auth.info("Sign in attempt");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throwAuth(error, "Sign in failed");
  return data;
}

export async function signOutAuth() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  log.auth.info("Sign out");
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    const localOnly = await supabase.auth.signOut({ scope: "local" });
    if (localOnly.error) throwAuth(localOnly.error, "Sign out failed");
  }
}

export function onAuthStateChanged(callback) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    log.auth.info("Auth state change", { event, hasUser: Boolean(session?.user) });
    callback({ event, session, user: session?.user ?? null });
  });
  return () => data.subscription.unsubscribe();
}

export async function loadUserProfile(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      log.auth.warn("profiles table missing", { userId });
      throw new ProfilesTableMissingError();
    }
    throwAuth(error, "Load profile failed");
  }
  log.auth.debug("Profile loaded", { userId, hasRow: Boolean(data) });
  return data;
}

async function requireActiveSession(supabase) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throwAuth(error, "Could not read session");
  if (!data.session) {
    const err = new Error("NO_AUTH_SESSION");
    /** @type {{ code?: string }} */ (err).code = "NO_AUTH_SESSION";
    throw err;
  }
}

export async function saveUserProfile(userId, patch) {
  const supabase = getSupabaseClient();
  if (!supabase) throwAuth(new Error("Supabase is not configured."), "Save profile");
  if (!userId) throwAuth(new Error("No authenticated user."), "Save profile");
  await requireActiveSession(supabase);
  log.auth.info("Saving profile", { fields: Object.keys(patch || {}) });

  const existing = await loadUserProfile(userId);
  const extendedPayload = buildProfileUpsertPayload(userId, existing, patch);

  const basePayload = {
    id: userId,
    username: extendedPayload.username,
    pan: extendedPayload.pan,
    pan_verified: extendedPayload.pan_verified,
    pan_updated_at: extendedPayload.pan_updated_at,
  };

  let { data, error } = await supabase
    .from(PROFILE_TABLE)
    .upsert(extendedPayload, { onConflict: "id" })
    .select("*")
    .single();
  if (error?.code === "42703") {
    log.auth.warn("Profile extended columns missing — fallback upsert");
    const fallback = await supabase
      .from(PROFILE_TABLE)
      .upsert(basePayload, { onConflict: "id" })
      .select("*")
      .single();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throwAuth(error, "Save profile failed");
  return data;
}

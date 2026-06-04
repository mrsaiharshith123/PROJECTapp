import { createClient } from "@supabase/supabase-js";
import { normalizePan } from "../../utils/pan.js";
import { log } from "../../utils/logger.js";
import { formatAuthError } from "../../utils/authErrors.js";
import { recordAccountActivity } from "../accountActivity.js";

let supabaseSingleton = null;

function throwAuth(err, context) {
  log.auth.error(context, { code: err?.code, status: err?.status });
  recordAccountActivity({
    type: "auth_error",
    level: "error",
    message: formatAuthError(err),
    detail: context,
  });
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

export async function getAuthSession() {
  const supabase = getSupabaseClient();
  if (!supabase) return { session: null, user: null };
  const { data, error } = await supabase.auth.getSession();
  if (error) throwAuth(error, "Could not read session");
  log.auth.debug("Session loaded", { hasSession: Boolean(data.session) });
  return { session: data.session, user: data.session?.user ?? null };
}

export async function signUpWithEmail(email, password, metadata = null) {
  const supabase = getSupabaseClient();
  if (!supabase) throwAuth(new Error("Supabase is not configured."), "Sign up");
  log.auth.info("Sign up attempt");
  const options = metadata && typeof metadata === "object" ? { data: metadata } : undefined;
  const { data, error } = await supabase.auth.signUp({ email, password, options });
  if (error) throwAuth(error, "Sign up failed");
  recordAccountActivity({ type: "sign_up", level: "success", message: "Account created" });
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
  const { error } = await supabase.auth.signOut();
  if (error) throwAuth(error, "Sign out failed");
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
  if (error) throwAuth(error, "Load profile failed");
  log.auth.debug("Profile loaded", { userId });
  return data;
}

export async function saveUserProfile(userId, patch) {
  const supabase = getSupabaseClient();
  if (!supabase) throwAuth(new Error("Supabase is not configured."), "Save profile");
  if (!userId) throwAuth(new Error("No authenticated user."), "Save profile");
  log.auth.info("Saving profile", { fields: Object.keys(patch || {}) });

  const basePayload = {
    id: userId,
    username: String(patch.username ?? "").trim(),
    pan: patch.pan ? normalizePan(patch.pan) : null,
    pan_verified: Boolean(patch.pan_verified),
    pan_updated_at: new Date().toISOString(),
  };

  const extendedPayload = {
    ...basePayload,
    display_name: String(patch.display_name ?? patch.username ?? "").trim(),
    user_mode: patch.user_mode ? String(patch.user_mode) : null,
    household_scope: patch.household_scope ? String(patch.household_scope) : null,
    monthly_income:
      patch.monthly_income == null ? null : Math.max(0, Number(patch.monthly_income) || 0),
    business_type: patch.business_type ? String(patch.business_type).trim() : null,
    onboarding_complete: patch.onboarding_complete == null ? null : Boolean(patch.onboarding_complete),
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
  recordAccountActivity({ type: "profile_saved", level: "success", message: "Account profile updated" });
  return data;
}

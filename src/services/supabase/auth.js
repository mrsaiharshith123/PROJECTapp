import { getSupabaseClient } from "./client.js";
import { normalizePan } from "../../utils/pan.js";

const PROFILE_TABLE = "profiles";

export async function getAuthSession() {
  const supabase = getSupabaseClient();
  if (!supabase) return { session: null, user: null };
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return { session: data.session, user: data.session?.user ?? null };
}

export async function signUpWithEmail(email, password, metadata = null) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const options = metadata && typeof metadata === "object" ? { data: metadata } : undefined;
  const { data, error } = await supabase.auth.signUp({ email, password, options });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutAuth() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChanged(callback) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({ session, user: session?.user ?? null });
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
  if (error) throw error;
  return data;
}

export async function saveUserProfile(userId, patch) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!userId) throw new Error("No authenticated user.");
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
    const fallback = await supabase
      .from(PROFILE_TABLE)
      .upsert(basePayload, { onConflict: "id" })
      .select("*")
      .single();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;
  return data;
}

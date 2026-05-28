import { createClient } from "@supabase/supabase-js";

let supabaseSingleton = null;

export function getSupabaseClient() {
  if (supabaseSingleton) return supabaseSingleton;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  supabaseSingleton = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseSingleton;
}

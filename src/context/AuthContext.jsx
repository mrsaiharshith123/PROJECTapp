import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getAuthSession,
  loadUserProfile,
  onAuthStateChanged,
  saveUserProfile,
  signInWithEmail,
  signOutAuth,
  signUpWithEmail,
} from "../services/supabase/auth.js";

/** @type {import('react').Context<import('../types/context.js').AuthContextValue | null>} */
const AuthContext = createContext(/** @type {import('../types/context.js').AuthContextValue | null} */ (null));

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    const p = await loadUserProfile(userId);
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    let mounted = true;
    getAuthSession()
      .then(async ({ session: s, user: u }) => {
        if (!mounted) return;
        setSession(s);
        setUser(u);
        if (u?.id) {
          await refreshProfile(u.id);
        }
      })
      .catch((e) => {
        if (mounted) setError((e instanceof Error ? e.message : null) || "Could not initialize auth.");
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    const unsubscribe = onAuthStateChanged(async ({ session: s, user: u }) => {
      setSession(s);
      setUser(u);
      setError(null);
      if (!u?.id) {
        setProfile(null);
        return;
      }
      try {
        await refreshProfile(u.id);
      } catch (e) {
        setError((e instanceof Error ? e.message : null) || "Could not load profile.");
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshProfile]);

  const signUp = useCallback(async (email, password, metadata = null) => {
    setError(null);
    const data = await signUpWithEmail(email, password, metadata);
    return data;
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    const data = await signInWithEmail(email, password);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await signOutAuth();
  }, []);

  const saveProfile = useCallback(
    async (patch) => {
      if (!user?.id) throw new Error("Please login first.");
      setError(null);
      const next = await saveUserProfile(user.id, patch);
      setProfile(next);
      return next;
    },
    [user]
  );

  const value = useMemo(
    () => ({
      isReady,
      session,
      user,
      profile,
      error,
      isLoggedIn: Boolean(user),
      signUp,
      signIn,
      signOut,
      saveProfile,
      refreshProfile: () => refreshProfile(user?.id),
    }),
    [isReady, session, user, profile, error, signUp, signIn, signOut, saveProfile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
  return ctx;
}

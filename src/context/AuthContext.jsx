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
import {
  ACCOUNT_ACTIVITY_EVENT,
  activityFromAuthEvent,
  clearAccountActivity,
  getAccountActivity,
  recordAccountActivity,
} from "../services/accountActivity.js";
import { formatAuthError } from "../utils/authErrors.js";
import { log } from "../utils/logger.js";

/** @type {import('react').Context<import('../types/context.js').AuthContextValue | null>} */
const AuthContext = createContext(/** @type {import('../types/context.js').AuthContextValue | null} */ (null));

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState(() => getAccountActivity());

  const refreshActivity = useCallback(() => {
    setActivity(getAccountActivity());
  }, []);

  useEffect(() => {
    const onActivity = () => refreshActivity();
    window.addEventListener(ACCOUNT_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(ACCOUNT_ACTIVITY_EVENT, onActivity);
  }, [refreshActivity]);

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
    log.auth.info("Auth provider starting");
    getAuthSession()
      .then(async ({ session: s, user: u }) => {
        if (!mounted) return;
        setSession(s);
        setUser(u);
        if (u?.id) {
          await refreshProfile(u.id);
          if (s) {
            recordAccountActivity({
              type: "session",
              level: "info",
              message: "Session restored on launch",
            });
          }
        }
      })
      .catch((e) => {
        const msg = formatAuthError(e);
        log.auth.error("Auth init failed", { message: msg });
        if (mounted) setError(msg);
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });

    const unsubscribe = onAuthStateChanged(async ({ event, session: s, user: u }) => {
      setSession(s);
      setUser(u);
      setError(null);

      const act = activityFromAuthEvent(event, u);
      if (act) recordAccountActivity(act);
      refreshActivity();

      if (!u?.id) {
        setProfile(null);
        return;
      }
      try {
        await refreshProfile(u.id);
      } catch (e) {
        const msg = formatAuthError(e);
        log.auth.error("Profile refresh failed", { event });
        setError(msg);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshProfile, refreshActivity]);

  const signUp = useCallback(async (email, password, metadata = null) => {
    setError(null);
    try {
      const data = await signUpWithEmail(email, password, metadata);
      refreshActivity();
      return data;
    } catch (e) {
      const msg = formatAuthError(e);
      setError(msg);
      throw e;
    }
  }, [refreshActivity]);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await signInWithEmail(email, password);
      refreshActivity();
      return data;
    } catch (e) {
      const msg = formatAuthError(e);
      setError(msg);
      throw e;
    }
  }, [refreshActivity]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await signOutAuth();
      refreshActivity();
    } catch (e) {
      const msg = formatAuthError(e);
      setError(msg);
      throw e;
    }
  }, [refreshActivity]);

  const saveProfile = useCallback(
    async (patch) => {
      if (!user?.id) throw new Error("Please sign in first.");
      setError(null);
      try {
        const next = await saveUserProfile(user.id, patch);
        setProfile(next);
        refreshActivity();
        return next;
      } catch (e) {
        const msg = formatAuthError(e);
        setError(msg);
        throw e;
      }
    },
    [user, refreshActivity],
  );

  const clearActivity = useCallback(() => {
    clearAccountActivity();
    refreshActivity();
  }, [refreshActivity]);

  const value = useMemo(
    () => ({
      isReady,
      session,
      user,
      profile,
      error,
      isLoggedIn: Boolean(user),
      activity,
      signUp,
      signIn,
      signOut,
      saveProfile,
      refreshProfile: () => refreshProfile(user?.id),
      refreshActivity,
      clearActivity,
    }),
    [
      isReady,
      session,
      user,
      profile,
      error,
      activity,
      signUp,
      signIn,
      signOut,
      saveProfile,
      refreshProfile,
      refreshActivity,
      clearActivity,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getAuthSession,
  getSupabaseClient,
  loadUserProfile,
  onAuthStateChanged,
  saveUserProfile,
  signInWithEmail,
  signOutAuth,
  signUpWithEmail,
} from "../services/supabase/auth.js";
import { formatAuthError } from "../utils/authErrors.js";
import {
  clearAccountSeedKeys,
  clearSignupPending,
  isProfilesTableMissingError,
  isSignupPending,
  markSignupPending,
  resetLocalAccountFlags,
} from "../utils/authSessionCleanup.js";
import { log } from "../utils/logger.js";
import { trackEvent } from "../services/analytics/trackEvent.js";
import { ANALYTICS_EVENTS } from "../services/analytics/eventNames.js";
import { setAnalyticsUser, clearAnalyticsUser } from "../services/analytics/analyticsHub.js";

/** @type {import('react').Context<import('../types/context.js').AuthContextValue | null>} */
const AuthContext = createContext(/** @type {import('../types/context.js').AuthContextValue | null} */ (null));

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [profileResolved, setProfileResolved] = useState(false);
  const [authNotice, setAuthNotice] = useState("");

  const hardSignOut = useCallback(async (userId, notice = "") => {
    await signOutAuth();
    clearAccountSeedKeys(userId);
    clearSignupPending();
    resetLocalAccountFlags();
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileResolved(true);
    clearAnalyticsUser();
    trackEvent(ANALYTICS_EVENTS.AUTH_SIGN_OUT, { module: "auth" });
    if (notice) setAuthNotice(notice);
  }, []);

  const enforceServerProfile = useCallback(
    async (userId, loadedProfile) => {
      if (!userId) return;
      if (isSignupPending()) return;

      if (!loadedProfile) {
        await hardSignOut(
          userId,
          "No account found on the server. Create your account again (run Supabase migrations if tables are missing).",
        );
        return;
      }

      if (!loadedProfile.onboarding_complete) {
        markSignupPending();
        return;
      }
      clearSignupPending();
    },
    [hardSignOut],
  );

  const refreshProfile = useCallback(
    async (userId) => {
      if (!userId) {
        setProfile(null);
        setProfileResolved(true);
        return null;
      }
      setProfileResolved(false);
      try {
        const p = await loadUserProfile(userId);
        setProfile(p);
        setProfileResolved(true);
        await enforceServerProfile(userId, p);
        if (p?.onboarding_complete) clearSignupPending();
        return p;
      } catch (e) {
        setProfileResolved(true);
        if (isProfilesTableMissingError(e)) {
          await hardSignOut(
            userId,
            "Account tables are missing in Supabase. Run migrations in supabase/migrations/, then create your account.",
          );
          return null;
        }
        throw e;
      }
    },
    [enforceServerProfile, hardSignOut],
  );

  useEffect(() => {
    let mounted = true;
    log.auth.info("Auth provider starting");
    getAuthSession()
      .then(async ({ session: s, user: u }) => {
        if (!mounted) return;
        setSession(s);
        setUser(u);
        if (u?.id) await refreshProfile(u.id);
        else setProfileResolved(true);
      })
      .catch((e) => {
        log.auth.error("Auth init failed", { message: formatAuthError(e) });
        if (mounted) setProfileResolved(true);
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });

    const unsubscribe = onAuthStateChanged(async ({ event, session: s, user: u }) => {
      setSession(s);
      setUser(u);
      if (!u?.id) {
        setProfile(null);
        setProfileResolved(true);
        return;
      }
      const supabase = getSupabaseClient();
      if (supabase && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          await hardSignOut(u.id, "Your session ended — sign in again.");
          return;
        }
      }
      try {
        await refreshProfile(u.id);
      } catch (e) {
        log.auth.error("Profile refresh failed", { message: formatAuthError(e) });
        if (!isProfilesTableMissingError(e)) {
          await hardSignOut(u.id, "Could not load your account. Sign in again.");
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshProfile, hardSignOut]);

  const signUp = useCallback(async (email, password, metadata = null) => {
    const result = await signUpWithEmail(email, password, metadata);
    const uid = result?.user?.id;
    if (uid) {
      setAnalyticsUser(uid);
      trackEvent(ANALYTICS_EVENTS.AUTH_SIGN_UP, { module: "auth" });
    }
    return result;
  }, []);

  const signIn = useCallback(async (email, password) => {
    setAuthNotice("");
    const result = await signInWithEmail(email, password);
    const uid = result?.user?.id;
    if (uid) {
      setAnalyticsUser(uid);
      trackEvent(ANALYTICS_EVENTS.AUTH_SIGN_IN, { module: "auth" });
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    const uid = user?.id;
    setAuthNotice("");
    await hardSignOut(uid);
  }, [user?.id, hardSignOut]);

  const saveProfile = useCallback(
    async (patch) => {
      if (!user?.id) throw new Error("Please sign in first.");
      const next = await saveUserProfile(user.id, patch);
      setProfile(next);
      setProfileResolved(true);
      if (patch.onboarding_complete) clearSignupPending();
      return next;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      isReady,
      session,
      user,
      profile,
      profileResolved,
      authNotice,
      error: null,
      isLoggedIn: Boolean(user),
      isAdmin: Boolean(profile?.is_admin),
      signUp,
      signIn,
      signOut,
      saveProfile,
      refreshProfile: () => refreshProfile(user?.id),
      clearAuthNotice: () => setAuthNotice(""),
    }),
    [isReady, session, user, profile, profileResolved, authNotice, signUp, signIn, signOut, saveProfile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
  return ctx;
}

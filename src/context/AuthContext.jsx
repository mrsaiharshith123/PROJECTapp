import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getAuthSession,
  loadUserProfile,
  onAuthStateChanged,
  requestPasswordReset,
  saveUserProfile,
  signInWithEmail,
  signOutAuth,
  signUpWithEmail,
  updateUserPassword,
} from "../services/supabase/auth.js";
import { formatAuthError, isTransientAuthError } from "../utils/authErrors.js";
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
import { isCurrentDeviceRevoked, upsertDeviceSession } from "../services/deviceSessions.js";
import { loadSettingsFromStorage } from "../utils/migrateStorage.js";
import { isCloudSyncConfigured } from "../services/sync/syncEngine.js";
import { withTimeout } from "../utils/withTimeout.js";

const PROFILE_LOAD_TIMEOUT_MS = 12000;

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
    await signOutAuth("local");
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
    async (userId, options = {}) => {
      const { background = false } = options;
      if (!userId) {
        setProfile(null);
        setProfileResolved(true);
        return null;
      }
      if (!background) setProfileResolved(false);
      try {
        const p = await withTimeout(loadUserProfile(userId), PROFILE_LOAD_TIMEOUT_MS, "profile");
        setProfile(p);
        setProfileResolved(true);
        await enforceServerProfile(userId, p);
        if (p?.onboarding_complete) clearSignupPending();
        return p;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message.includes("profile_timeout")) {
          log.auth.warn("Profile load timed out — keeping session, will retry");
          if (!background) setProfileResolved(false);
          return null;
        }
        setProfileResolved(true);
        if (isProfilesTableMissingError(e)) {
          await hardSignOut(
            userId,
            "Account tables are missing in Supabase. Run migrations in supabase/migrations/, then create your account.",
          );
          return null;
        }
        if (isTransientAuthError(e)) {
          log.auth.warn("Profile load transient error — keeping session", { message: formatAuthError(e) });
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
      try {
        await refreshProfile(u.id, { background: event === "TOKEN_REFRESHED" });
        if (isCloudSyncConfigured()) {
          try {
            const revoked = await isCurrentDeviceRevoked(u.id);
            if (revoked) {
              await hardSignOut(u.id, "This device was signed out from Security settings.");
              return;
            }
            await upsertDeviceSession(u.id, loadSettingsFromStorage());
          } catch {
            /* device table may not exist yet */
          }
        }
      } catch (e) {
        log.auth.error("Profile refresh failed", { message: formatAuthError(e) });
        if (isTransientAuthError(e) || event === "TOKEN_REFRESHED") return;
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

  useEffect(() => {
    if (!user?.id || profile || profileResolved) return;
    const timer = window.setTimeout(() => {
      void refreshProfile(user.id, { background: true });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [user?.id, profile, profileResolved, refreshProfile]);

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
    await signOutAuth("global");
    clearAccountSeedKeys(uid);
    clearSignupPending();
    resetLocalAccountFlags();
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileResolved(true);
    clearAnalyticsUser();
    trackEvent(ANALYTICS_EVENTS.AUTH_SIGN_OUT, { module: "auth" });
  }, [user?.id]);

  const resetPassword = useCallback(async (email) => {
    setAuthNotice("");
    await requestPasswordReset(email);
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    setAuthNotice("");
    await updateUserPassword(newPassword);
  }, []);

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
      resetPassword,
      updatePassword,
      saveProfile,
      refreshProfile: () => refreshProfile(user?.id),
      clearAuthNotice: () => setAuthNotice(""),
    }),
    [
      isReady,
      session,
      user,
      profile,
      profileResolved,
      authNotice,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      saveProfile,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
  return ctx;
}

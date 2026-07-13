import { useCallback, useEffect, useMemo, useState } from "react";
import { loadSubscriptionTier } from "../services/supabase/auth.js";
import { invalidateInitialAppStateCache } from "../utils/migrateStorage.js";

/**
 * Loads the server-verified subscription tier for logged-in users and keeps
 * `settings.subscriptionTier` mirrored to it. `effectiveSubscriptionTier` is
 * the value the rest of the app should trust — server tier when logged in,
 * local settings tier for logged-out/local-only use.
 *
 * @param {{ id?: string } | null | undefined} user
 * @param {{ subscriptionTier?: string }} settings
 * @param {(updater: any) => void} setSettings
 */
export function useSubscriptionTierSync(user, settings, setSettings) {
  const [serverSubscriptionTier, setServerSubscriptionTier] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!user?.id) {
      queueMicrotask(() => setServerSubscriptionTier(null));
      return;
    }
    loadSubscriptionTier(user.id)
      .then((tier) => {
        setServerSubscriptionTier(tier);
        setSettings((prev) => {
          if (tier === (prev.subscriptionTier || "free")) return prev;
          const next = { ...prev, subscriptionTier: tier };
          try {
            localStorage.setItem("perovo_settings", JSON.stringify(next));
            invalidateInitialAppStateCache();
          } catch {
            /* ignore */
          }
          return next;
        });
      })
      .catch(() => {
        setServerSubscriptionTier("free");
      });
  }, [user?.id, setSettings]);

  const refreshSubscriptionTier = useCallback(async () => {
    if (!user?.id) return "free";
    const tier = await loadSubscriptionTier(user.id);
    setServerSubscriptionTier(tier);
    setSettings((prev) => {
      if (tier === (prev.subscriptionTier || "free")) return prev;
      const next = { ...prev, subscriptionTier: tier };
      try {
        localStorage.setItem("perovo_settings", JSON.stringify(next));
        invalidateInitialAppStateCache();
      } catch {
        /* ignore */
      }
      return next;
    });
    return tier;
  }, [user, setSettings]);

  const effectiveSubscriptionTier = useMemo(() => {
    if (user?.id) return serverSubscriptionTier ?? "free";
    return settings.subscriptionTier || "free";
  }, [user?.id, serverSubscriptionTier, settings.subscriptionTier]);

  return { serverSubscriptionTier, effectiveSubscriptionTier, refreshSubscriptionTier };
}

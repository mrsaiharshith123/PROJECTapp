import { useEffect } from "react";
import { loadSettingsFromServer, syncSettingsToServer } from "../services/supabase/auth.js";
import { loadSettingsFromStorage, invalidateInitialAppStateCache } from "../utils/migrateStorage.js";
import { mergeAccountSettingsFromServer } from "../utils/accountSettingsSync.js";

/**
 * On login, pulls server-stored settings and merges them into local settings
 * (server wins for account-level fields; local wins for device-level ones —
 * see mergeAccountSettingsFromServer). Writes go through `setSettings`
 * directly, not `persistSettings`, so this merge doesn't re-trigger the
 * debounced settings->server sync it just pulled from.
 *
 * @param {{ id?: string } | null | undefined} user
 * @param {(next: object) => void} setSettings
 */
export function useServerSettingsSync(user, setSettings) {
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const local = loadSettingsFromStorage();
      let serverSettings = null;
      try {
        serverSettings = await loadSettingsFromServer();
      } catch {
        /* ignore */
      }
      if (cancelled) return;

      const merged = serverSettings ? mergeAccountSettingsFromServer(local, serverSettings) : local;

      if (serverSettings && merged !== local) {
        try {
          localStorage.setItem("perovo_settings", JSON.stringify(merged));
          invalidateInitialAppStateCache();
        } catch {
          /* ignore */
        }
        setSettings(merged);
      }

      await syncSettingsToServer(merged).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, setSettings]);
}

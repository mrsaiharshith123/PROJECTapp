import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { usePerovo } from "../context/PerovoContext.jsx";
import { hasPaidBackupTier } from "../constants/subscriptionTiers.js";
import {
  canUseCloudSync,
  isCloudSyncConfigured,
  pullRemoteSnapshotToLocal,
  pushLocalSnapshotToCloud,
} from "../services/sync/syncEngine.js";
import { loadSyncMeta } from "../services/sync/syncMeta.js";
import { loadFullAppStateForSync } from "../utils/migrateStorage.js";

export function useCloudSync() {
  const { user, isLoggedIn } = useAuth();
  const track = usePerovo();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const enabled = canUseCloudSync(track.settings, isLoggedIn);
  const configured = isCloudSyncConfigured();
  const meta = loadSyncMeta();

  const getSyncCtx = useCallback(
    () => ({
      userId: user?.id,
      getState: loadFullAppStateForSync,
      applySnapshot: track.importAppData,
    }),
    [user?.id, track.importAppData],
  );

  const backupDisabledReason = useCallback(() => {
    if (!isLoggedIn) return "Sign in to use account backup.";
    if (!configured) return "Cloud backup is not configured for this build.";
    if (!hasPaidBackupTier(track.settings)) return "Account backup needs Pro or Power — see Plans.";
    if (!track.settings.cloudSyncEnabled) return "Turn on Perovo cloud data backup in Backup & data.";
    return null;
  }, [isLoggedIn, configured, track.settings]);

  const pushNow = useCallback(async () => {
    const block = backupDisabledReason();
    if (block) {
      setError(block);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await pushLocalSnapshotToCloud(getSyncCtx());
      if (r.ok) setMessage("Account backup saved.");
      else if (r.reason === "disabled") setError(backupDisabledReason() || "Backup is not available.");
      else if (r.reason === "throttled") setMessage("Backup is up to date (recently synced).");
      else setMessage("Nothing to push right now.");
    } catch (e) {
      setError((e instanceof Error ? e.message : null) || "Account backup failed.");
    } finally {
      setBusy(false);
    }
  }, [getSyncCtx, backupDisabledReason]);

  const pullNow = useCallback(
    async ({ preferLocal = false, force = false } = {}) => {
      if (!isLoggedIn) {
        setError("Sign in to restore your backup.");
        return;
      }
      if (!configured) {
        setError("Cloud backup is not configured for this build.");
        return;
      }
      setBusy(true);
      setError("");
      setMessage("");
      try {
        const r = await pullRemoteSnapshotToLocal({ ...getSyncCtx(), preferLocal, force });
        if (r.ok) {
          setMessage("Restored from your account backup.");
          window.location.reload();
          return;
        }
        if (r.reason === "local-newer") setMessage("This device already has newer data — back up first or force restore.");
        else if (r.reason === "remote-empty") setMessage("Cloud backup is empty — your local data was kept.");
        else if (r.reason === "empty") setMessage("No account backup found yet.");
        else setMessage("Restore skipped.");
      } catch (e) {
        setError((e instanceof Error ? e.message : null) || "Restore failed.");
      } finally {
        setBusy(false);
      }
    },
    [getSyncCtx, configured, isLoggedIn],
  );

  const forcePull = useCallback(() => pullNow({ preferLocal: false, force: true }), [pullNow]);

  return {
    configured,
    enabled,
    busy,
    message,
    error,
    meta,
    pushNow,
    pullNow,
    forcePull,
    setMessage,
    setError,
  };
}

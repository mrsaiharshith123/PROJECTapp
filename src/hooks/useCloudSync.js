import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import {
  canUseCloudSync,
  isCloudSyncConfigured,
  pullRemoteSnapshotToLocal,
  pushLocalSnapshotToCloud,
} from "../services/sync/syncEngine.js";
import { loadSyncMeta } from "../services/sync/syncMeta.js";
import { loadFullAppStateForSync } from "../utils/migrateStorage.js";
import { recordAccountActivity } from "../services/accountActivity.js";

export function useCloudSync() {
  const { user, isLoggedIn } = useAuth();
  const track = useCommitTrack();
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

  const pushNow = useCallback(async () => {
    if (!user?.id) {
      setError("Sign in to use CommitTrack Cloud.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await pushLocalSnapshotToCloud(getSyncCtx());
      if (r.ok) setMessage("Cloud backup saved.");
      else if (r.reason === "disabled") setError("Enable CommitTrack Cloud in settings.");
      else if (r.reason === "throttled") {
        setMessage("Backup is up to date (recently synced).");
        recordAccountActivity({ type: "sync_push", level: "info", message: "Backup skipped (recently synced)" });
      } else setMessage("Nothing to push right now.");
    } catch (e) {
      setError((e instanceof Error ? e.message : null) || "Cloud backup failed.");
    } finally {
      setBusy(false);
    }
  }, [user?.id, getSyncCtx]);

  const pullNow = useCallback(
    async ({ preferLocal = false } = {}) => {
      if (!user?.id) {
        setError("Sign in to restore from CommitTrack Cloud.");
        return;
      }
      setBusy(true);
      setError("");
      setMessage("");
      try {
        const r = await pullRemoteSnapshotToLocal({ ...getSyncCtx(), preferLocal });
        if (r.ok) setMessage("Restored from CommitTrack Cloud.");
        else if (r.reason === "local-newer") setMessage("This device already has newer data — push first or force restore.");
        else if (r.reason === "empty") setMessage("No cloud backup found yet.");
        else setMessage("Restore skipped.");
      } catch (e) {
        setError((e instanceof Error ? e.message : null) || "Cloud restore failed.");
      } finally {
        setBusy(false);
      }
    },
    [user?.id, getSyncCtx],
  );

  const forcePull = useCallback(() => pullNow({ preferLocal: false }), [pullNow]);

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

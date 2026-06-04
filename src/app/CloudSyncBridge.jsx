import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { DATA_CHANGED_EVENT } from "../storage/events.js";
import {
  canUseCloudSync,
  cancelScheduledCloudPush,
  pullRemoteSnapshotToLocal,
  scheduleCloudPush,
} from "../services/sync/syncEngine.js";
import { saveSyncMeta } from "../services/sync/syncMeta.js";
import { loadFullAppStateForSync } from "../utils/migrateStorage.js";
import { log } from "../utils/logger.js";
import { recordAccountActivity } from "../services/accountActivity.js";

/** Background local-first → cloud sync (optional; never blocks UI). */
export default function CloudSyncBridge() {
  const { user, isLoggedIn, isReady } = useAuth();
  const track = useCommitTrack();
  const pulledRef = useRef(false);

  useEffect(() => {
    if (!isReady || !isLoggedIn || !user?.id) {
      cancelScheduledCloudPush();
      pulledRef.current = false;
      return;
    }

    saveSyncMeta({ userId: user.id });

    if (!canUseCloudSync(track.settings, true)) return;

    if (!pulledRef.current) {
      pulledRef.current = true;
      pullRemoteSnapshotToLocal({
        userId: user.id,
        getState: loadFullAppStateForSync,
        applySnapshot: track.importAppData,
        preferLocal:
          (track.allCommitments?.length ?? track.commitments.length) > 0 ||
          (track.allLendings?.length ?? track.lendings.length) > 0,
      })
        .then((r) => {
          if (r?.ok) log.sync.info("Startup cloud pull applied");
          else if (r?.reason === "local-newer") log.sync.debug("Startup pull skipped — local newer");
          else if (r?.reason === "empty") log.sync.debug("No remote snapshot yet");
        })
        .catch((err) => {
          log.sync.warn("Startup cloud pull failed", { message: err instanceof Error ? err.message : String(err) });
          recordAccountActivity({
            type: "sync_error",
            level: "warn",
            message: "Could not sync from cloud on startup",
            detail: err instanceof Error ? err.message : undefined,
          });
        });
    }

    const onChange = () => {
      scheduleCloudPush({
        userId: user.id,
        getState: loadFullAppStateForSync,
        applySnapshot: track.importAppData,
      });
    };

    window.addEventListener(DATA_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, onChange);
      cancelScheduledCloudPush();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- pull once per session; push via data-changed event
  }, [isReady, isLoggedIn, user?.id, track.settings.cloudSyncEnabled, track.settings.subscriptionTier, track.importAppData]);

  return null;
}

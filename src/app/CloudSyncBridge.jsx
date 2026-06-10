import { useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { DATA_CHANGED_EVENT } from "../storage/events.js";
import {
  canUseCloudSync,
  cancelScheduledCloudPush,
  scheduleCloudPush,
} from "../services/sync/syncEngine.js";
import { saveSyncMeta } from "../services/sync/syncMeta.js";
import { loadFullAppStateForSync } from "../utils/migrateStorage.js";

/** Background local-first → Supabase account backup when signed in (never blocks UI). */
export default function CloudSyncBridge() {
  const { user, isLoggedIn, isReady } = useAuth();
  const track = useCommitTrack();
  useEffect(() => {
    if (!isReady || !isLoggedIn || !user?.id) {
      cancelScheduledCloudPush();
      return;
    }

    saveSyncMeta({ userId: user.id });

    if (!canUseCloudSync(track.settings, true)) return;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- push on enable + data-changed event; restore is manual only
  }, [
    isReady,
    isLoggedIn,
    user?.id,
    track.importAppData,
    track.settings.cloudSyncEnabled,
    track.settings.subscriptionTier,
  ]);

  return null;
}

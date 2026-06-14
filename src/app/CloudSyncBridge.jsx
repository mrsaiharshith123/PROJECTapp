import { useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { DATA_CHANGED_EVENT } from "../storage/events.js";
import {
  canUseCloudSync,
  cancelScheduledCloudPush,
  scheduleCloudPush,
  pushDailyCloudBackupIfDue,
  tryAutoRestoreFromCloud,
} from "../services/sync/syncEngine.js";
import { saveSyncMeta } from "../services/sync/syncMeta.js";
import { loadFullAppStateForSync } from "../utils/migrateStorage.js";

const DAY_MS = 24 * 60 * 60 * 1000;

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

    const ctx = {
      userId: user.id,
      getState: loadFullAppStateForSync,
      applySnapshot: track.importAppData,
    };

    tryAutoRestoreFromCloud(ctx).catch(() => {
      /* non-blocking */
    });

    if (!canUseCloudSync(track.settings, true)) return;

    pushDailyCloudBackupIfDue(ctx).catch(() => {
      /* non-blocking */
    });

    const onChange = () => {
      scheduleCloudPush(ctx);
    };

    const dailyId = window.setInterval(() => {
      pushDailyCloudBackupIfDue(ctx).catch(() => {
        /* non-blocking */
      });
    }, DAY_MS);

    window.addEventListener(DATA_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, onChange);
      cancelScheduledCloudPush();
      window.clearInterval(dailyId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- push on enable + data-changed event
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

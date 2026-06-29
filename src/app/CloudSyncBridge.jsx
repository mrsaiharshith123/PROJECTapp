import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { usePerovo } from "../context/PerovoContext.jsx";
import { DATA_CHANGED_EVENT } from "../storage/events.js";
import {
  canUseCloudSync,
  cancelScheduledCloudPush,
  scheduleCloudPush,
  pushLocalSnapshotToCloud,
} from "../services/sync/syncEngine.js";
import { SYNC_AUTO_BACKUP_INTERVAL_MS } from "../services/sync/constants.js";
import { saveSyncMeta } from "../services/sync/syncMeta.js";
import { loadFullAppStateForSync } from "../utils/migrateStorage.js";

/** Background local-first → Supabase account backup when signed in (never blocks UI). */
export default function CloudSyncBridge() {
  const { user, isLoggedIn, isReady } = useAuth();
  const track = usePerovo();
  const importAppDataRef = useRef(track.importAppData);
  useEffect(() => {
    importAppDataRef.current = track.importAppData;
  }, [track.importAppData]);

  useEffect(() => {
    if (!isReady || !isLoggedIn || !user?.id) {
      cancelScheduledCloudPush();
      return;
    }

    saveSyncMeta({ userId: user.id });

    const ctx = {
      userId: user.id,
      getState: loadFullAppStateForSync,
      applySnapshot: (payload, options) => importAppDataRef.current(payload, options),
    };

    if (!canUseCloudSync(track.settings, true)) return;

    const onChange = () => {
      scheduleCloudPush(ctx);
    };

    const periodicId = window.setInterval(() => {
      pushLocalSnapshotToCloud(ctx).catch(() => {
        /* non-blocking */
      });
    }, SYNC_AUTO_BACKUP_INTERVAL_MS);

    window.addEventListener(DATA_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, onChange);
      cancelScheduledCloudPush();
      window.clearInterval(periodicId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- push on enable + data-changed event
  }, [
    isReady,
    isLoggedIn,
    user?.id,
    track.settings.cloudSyncEnabled,
    track.settings.subscriptionTier,
  ]);

  return null;
}

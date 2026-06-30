import { useEffect, useRef, useState } from "react";
import { isEmbeddedApp } from "../utils/embeddedApp.js";
import { isUpdateTestShell } from "../utils/updateTestShell.js";
import { checkForAppUpdate, applyAppUpdate } from "../services/appUpdate.js";
import {
  isCloudSyncConfigured,
  syncCloudBackupAtStartup,
  wasAccountBackupEnabledLocally,
} from "../services/sync/syncEngine.js";
import { loadFullAppStateForSync, invalidateInitialAppStateCache } from "../utils/migrateStorage.js";
import { useAuth } from "../context/AuthContext.jsx";
import { usePerovo } from "../context/PerovoContext.jsx";
import { useTranslation } from "../i18n/I18nProvider.js";
import BootShell from "../boot/BootShell.jsx";
import UpdateProgressModal from "../ui/features/UpdateProgressModal.jsx";

const CHECK_TIMEOUT_MS = 10000;
const AUTH_WAIT_MS = 12000;
const CLOUD_SYNC_TIMEOUT_MS = 15000;
const STARTUP_UPDATE_ATTEMPT_KEY = "perovo_startup_update_attempt";

function shouldRunStartupUpdate() {
  return isEmbeddedApp() && !isUpdateTestShell();
}

function shouldRunStartupCloudSync() {
  return !isUpdateTestShell();
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function startupUpdateAttemptKey(manifest) {
  if (!manifest?.version) return "";
  return `${manifest.version}@${manifest.builtAt || ""}`;
}

/**
 * Blocks the app until cold-start update + optional cloud backup sync finish.
 * Runs before login UI so broken builds and stale backups heal on open.
 */
export default function StartupUpdateGate({ children }) {
  const { t } = useTranslation();
  const { user, isLoggedIn, isReady: authReady } = useAuth();
  const track = usePerovo();
  const importAppDataRef = useRef(track.importAppData);
  const authRef = useRef({ isReady: authReady, isLoggedIn, user });

  const needsBootstrap = shouldRunStartupUpdate() || shouldRunStartupCloudSync();
  const [ready, setReady] = useState(!needsBootstrap);
  const [updating, setUpdating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [awaitingCloud, setAwaitingCloud] = useState(() => {
    if (!shouldRunStartupCloudSync()) return false;
    try {
      return wasAccountBackupEnabledLocally(loadFullAppStateForSync().settings);
    } catch {
      return false;
    }
  });
  const [progress, setProgress] = useState({ phase: "checking", percent: 0 });

  useEffect(() => {
    importAppDataRef.current = track.importAppData;
  }, [track.importAppData]);

  useEffect(() => {
    authRef.current = { isReady: authReady, isLoggedIn, user };
  }, [authReady, isLoggedIn, user]);

  useEffect(() => {
    if (!needsBootstrap || ready) return undefined;

    let cancelled = false;

    async function waitForAuth() {
      const start = Date.now();
      while (Date.now() - start < AUTH_WAIT_MS) {
        if (cancelled) return authRef.current;
        if (authRef.current.isReady) return authRef.current;
        await sleep(100);
      }
      return authRef.current;
    }

    async function runCloudSync() {
      const localSettings = loadFullAppStateForSync().settings;
      if (!wasAccountBackupEnabledLocally(localSettings) || !isCloudSyncConfigured()) {
        setAwaitingCloud(false);
        return;
      }

      const auth = await waitForAuth();
      if (cancelled) return;

      if (!auth.isLoggedIn || !auth.user?.id) {
        setAwaitingCloud(false);
        return;
      }

      setAwaitingCloud(false);
      setSyncing(true);

      const ctx = {
        userId: auth.user.id,
        getState: loadFullAppStateForSync,
        applySnapshot: (payload, options) => importAppDataRef.current(payload, options),
      };

      try {
        const result = await Promise.race([
          syncCloudBackupAtStartup(ctx),
          new Promise((resolve) => {
            window.setTimeout(() => resolve({ ok: false, reason: "timeout", action: "none" }), CLOUD_SYNC_TIMEOUT_MS);
          }),
        ]);

        if (cancelled) return;

        if (result?.ok && result.action === "pull") {
          invalidateInitialAppStateCache();
        }
      } catch {
        /* non-blocking — login / manual restore still available */
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    async function runAppUpdate() {
      if (!shouldRunStartupUpdate()) return { restarting: false };

      setProgress({ phase: "checking", percent: 0 });

      let check;
      try {
        check = await Promise.race([
          checkForAppUpdate(),
          new Promise((resolve) => {
            window.setTimeout(() => resolve({ status: "unknown" }), CHECK_TIMEOUT_MS);
          }),
        ]);
      } catch {
        check = { status: "unknown" };
      }

      if (cancelled) return { restarting: false };

      if (check?.status !== "available") return { restarting: false };

      const attemptKey = startupUpdateAttemptKey(check);
      if (attemptKey && sessionStorage.getItem(STARTUP_UPDATE_ATTEMPT_KEY) === attemptKey) {
        return { restarting: false };
      }
      if (attemptKey) {
        sessionStorage.setItem(STARTUP_UPDATE_ATTEMPT_KEY, attemptKey);
      }

      setUpdating(true);
      setProgress({ phase: "downloading", percent: 0 });

      try {
        const result = await applyAppUpdate({
          onProgress: (p) => {
            if (!cancelled) setProgress(p);
          },
        });

        if (cancelled) return { restarting: false };

        if (result?.status === "apk_install") {
          return { restarting: false };
        }

        if (result?.status === "restarting") {
          return { restarting: true };
        }
      } catch {
        /* allow app to open */
      } finally {
        if (!cancelled) setUpdating(false);
      }

      return { restarting: false };
    }

    async function run() {
      const updateResult = await runAppUpdate();
      if (cancelled || updateResult?.restarting) return;

      if (shouldRunStartupCloudSync()) {
        await runCloudSync();
      }

      if (!cancelled) setReady(true);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [needsBootstrap, ready]);

  if (ready) return children;

  if (updating) {
    return <UpdateProgressModal open progress={progress} />;
  }

  if (syncing || awaitingCloud) {
    return <BootShell message={t("startup.cloudSyncInProgress")} />;
  }

  return <BootShell message={t("startup.updateGateChecking")} />;
}

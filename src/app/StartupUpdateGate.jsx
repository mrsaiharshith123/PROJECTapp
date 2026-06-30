import { useEffect, useRef, useState } from "react";
import { isEmbeddedApp } from "../utils/embeddedApp.js";
import { isUpdateTestShell } from "../utils/updateTestShell.js";
import { checkForAppUpdate, applyAppUpdate } from "../services/appUpdate.js";
import { openCachedApkInstall } from "../services/nativeApkUpdate.js";
import { clearPendingApkInstall } from "../services/pendingApkInstall.js";
import { useTranslation } from "../i18n/I18nProvider.js";
import BootShell from "../boot/BootShell.jsx";
import UpdateProgressModal from "../ui/features/UpdateProgressModal.jsx";
import { Body, Button, Caption, Modal } from "../ui/index.js";

const CHECK_TIMEOUT_MS = 10000;
const BOOTSTRAP_MAX_MS = 20000;
const OTA_ATTEMPT_KEY = "perovo_startup_ota_attempt";

function shouldRunStartupUpdate() {
  return isEmbeddedApp() && !isUpdateTestShell();
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function otaAttemptKey(manifest) {
  if (!manifest?.version) return "";
  return `${manifest.version}@${manifest.builtAt || ""}`;
}

/**
 * Checks for updates on open: OTA bundle first, then APK download + install prompt.
 * Never blocks the app longer than BOOTSTRAP_MAX_MS.
 */
export default function StartupUpdateGate({ children }) {
  const { t } = useTranslation();
  const needsBootstrap = shouldRunStartupUpdate();
  const [ready, setReady] = useState(!needsBootstrap);
  const [updating, setUpdating] = useState(false);
  const [apkPrompt, setApkPrompt] = useState(null);
  const [progress, setProgress] = useState({ phase: "checking", percent: 0 });
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!needsBootstrap || ready) return undefined;

    let cancelled = false;
    finishedRef.current = false;

    const finish = () => {
      if (cancelled || finishedRef.current) return;
      finishedRef.current = true;
      setUpdating(false);
      setReady(true);
    };

    const bootstrapTimer = window.setTimeout(finish, BOOTSTRAP_MAX_MS);

    async function runAppUpdate() {
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

      if (check?.status === "apk_pending" && check.remoteVersion) {
        setApkPrompt({ version: check.remoteVersion });
        return { restarting: false };
      }

      if (check?.status !== "available") return { restarting: false };

      if (check.needsOta) {
        const attemptKey = otaAttemptKey(check);
        if (!attemptKey || localStorage.getItem(OTA_ATTEMPT_KEY) !== attemptKey) {
          if (attemptKey) localStorage.setItem(OTA_ATTEMPT_KEY, attemptKey);
          setUpdating(true);
          setProgress({ phase: "downloading", percent: 0 });
          try {
            const result = await applyAppUpdate({
              allowApk: false,
              onProgress: (p) => {
                if (!cancelled) setProgress(p);
              },
            });
            if (cancelled) return { restarting: false };
            if (result?.status === "restarting") return { restarting: true };
          } catch {
            /* continue to APK or app */
          } finally {
            if (!cancelled) setUpdating(false);
          }

          if (cancelled) return { restarting: false };
          try {
            check = await checkForAppUpdate();
          } catch {
            return { restarting: false };
          }
        }
      }

      if (check?.status === "available" && check.needsApk) {
        setUpdating(true);
        setProgress({ phase: "downloading", percent: 0 });
        try {
          const result = await applyAppUpdate({
            allowApk: true,
            onProgress: (p) => {
              if (!cancelled) setProgress(p);
            },
          });
          if (cancelled) return { restarting: false };
          if (result?.status === "apk_install") {
            return { restarting: false };
          }
          if (result?.status === "restarting") return { restarting: true };
        } catch {
          if (check.remoteVersion) {
            setApkPrompt({ version: check.remoteVersion });
          }
        } finally {
          if (!cancelled) setUpdating(false);
        }
      }

      return { restarting: false };
    }

    async function run() {
      try {
        const updateResult = await runAppUpdate();
        if (cancelled || updateResult?.restarting) return;
      } finally {
        window.clearTimeout(bootstrapTimer);
        finish();
      }
    }

    run();

    return () => {
      cancelled = true;
      window.clearTimeout(bootstrapTimer);
    };
  }, [needsBootstrap, ready]);

  const onInstallApk = async () => {
    if (!apkPrompt?.version) return;
    try {
      await openCachedApkInstall(apkPrompt.version);
    } catch {
      setUpdating(true);
      try {
        await applyAppUpdate({
          allowApk: true,
          onProgress: setProgress,
        });
      } finally {
        setUpdating(false);
      }
    }
  };

  const onSkipApk = () => {
    clearPendingApkInstall();
    setApkPrompt(null);
  };

  if (ready) {
    return (
      <>
        {children}
        {apkPrompt ? (
          <Modal onClose={onSkipApk} title={t("startup.apkReadyTitle")}>
            <div className="ct-stack-sm">
              <Body className="!text-sm">{t("startup.apkReadyBody", { version: apkPrompt.version })}</Body>
              <Caption className="block">{t("startup.apkReadyHint")}</Caption>
              <div className="ct-grid-2">
                <Button type="button" variant="primary" size="sm" onClick={onInstallApk}>
                  {t("startup.apkInstallNow")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onSkipApk}>
                  {t("startup.apkInstallLater")}
                </Button>
              </div>
            </div>
          </Modal>
        ) : null}
      </>
    );
  }

  if (updating) {
    return <UpdateProgressModal open progress={progress} />;
  }

  return <BootShell message={t("startup.updateGateChecking")} />;
}

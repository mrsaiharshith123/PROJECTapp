import { useEffect, useRef, useState } from "react";
import { isEmbeddedApp } from "../utils/embeddedApp.js";
import { isUpdateTestShell } from "../utils/updateTestShell.js";
import { checkForAppUpdate, applyAppUpdate, fetchRemoteManifest } from "../services/appUpdate.js";
import { downloadNativeApk, openCachedApkInstall } from "../services/nativeApkUpdate.js";
import {
  dismissApkInstallPrompt,
  isApkDownloadedForVersion,
  isApkInstallPromptDismissed,
} from "../services/pendingApkInstall.js";
import { useTranslation } from "../i18n/I18nProvider.js";
import BootShell from "../boot/BootShell.jsx";
import UpdateProgressModal from "../ui/features/UpdateProgressModal.jsx";
import { Body, Button, Caption, Modal } from "../ui/index.js";

const CHECK_TIMEOUT_MS = 10000;
const BOOTSTRAP_MAX_MS = 20000;

function shouldRunStartupUpdate() {
  return isEmbeddedApp() && !isUpdateTestShell();
}

function maybeShowApkPrompt(check, setApkPrompt) {
  if (!check?.remoteVersion) return;
  if (check.status !== "apk_ready") return;
  if (isApkInstallPromptDismissed(check.remoteVersion)) return;
  setApkPrompt({ version: check.remoteVersion });
}

/**
 * Checks for updates on open: OTA first, then one APK download per version.
 * Never re-downloads an APK that is already cached.
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

      if (cancelled) return;

      if (check?.status === "apk_ready") {
        maybeShowApkPrompt(check, setApkPrompt);
        return;
      }

      if (check?.status !== "available") return;

      if (check.needsOta) {
        setUpdating(true);
        setProgress({ phase: "downloading", percent: 0 });
        try {
          const result = await applyAppUpdate({
            allowApk: false,
            onProgress: (p) => {
              if (!cancelled) setProgress(p);
            },
          });
          if (cancelled) return;
          if (result?.status === "restarting") return;
        } catch {
          /* non-blocking */
        } finally {
          if (!cancelled) setUpdating(false);
        }

        if (cancelled) return;
        try {
          check = await checkForAppUpdate();
        } catch {
          return;
        }
      }

      if (check?.status === "apk_ready") {
        maybeShowApkPrompt(check, setApkPrompt);
        return;
      }

      if (!check?.needsApk || !check.remoteVersion) return;

      if (isApkDownloadedForVersion(check.remoteVersion)) {
        maybeShowApkPrompt({ ...check, status: "apk_ready" }, setApkPrompt);
        return;
      }

      setUpdating(true);
      setProgress({ phase: "downloading", percent: 0 });
      try {
        const remote = await fetchRemoteManifest();
        if (remote) {
          await downloadNativeApk(remote, (p) => {
            if (!cancelled) setProgress(p);
          });
        }
        if (!cancelled && check.remoteVersion) {
          maybeShowApkPrompt({ ...check, status: "apk_ready" }, setApkPrompt);
        }
      } catch {
        /* allow app to open */
      } finally {
        if (!cancelled) setUpdating(false);
      }
    }

    async function run() {
      try {
        await runAppUpdate();
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
      /* user can retry from Profile */
    }
  };

  const onSkipApk = () => {
    if (apkPrompt?.version) {
      dismissApkInstallPrompt(apkPrompt.version);
    }
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

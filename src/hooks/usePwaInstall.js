import { useCallback, useEffect, useState } from "react";
import { isEmbeddedApp } from "../utils/embeddedApp.js";
import {
  INSTALL_OPT_IN_EVENT,
  readInstallOptIn,
  readInstallPlatform,
} from "../utils/appDownload.js";

const DISMISS_KEY = "perovo_pwa_install_dismissed";

function readStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  );
}

export function usePwaInstall() {
  const embedded = isEmbeddedApp();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [optIn, setOptIn] = useState(readInstallOptIn);
  const [platform, setPlatform] = useState(readInstallPlatform);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [isStandalone] = useState(readStandalone);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    const syncOptIn = () => {
      setOptIn(readInstallOptIn());
      setPlatform(readInstallPlatform());
      setDismissed(false);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener(INSTALL_OPT_IN_EVENT, syncOptIn);
    return () => window.removeEventListener(INSTALL_OPT_IN_EVENT, syncOptIn);
  }, []);

  const wantsWindowsPwa = optIn && platform === "windows";
  const canInstall = !embedded && Boolean(deferredPrompt) && !isStandalone && wantsWindowsPwa && !dismissed;
  const showIosHint = false;
  const showAndroidHint = false;
  const showInstallUi = !embedded && !isStandalone && wantsWindowsPwa && !dismissed;

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  return {
    canInstall,
    showIosHint,
    showAndroidHint,
    showInstallUi,
    install,
    dismiss,
    isStandalone,
  };
}

import { useCallback, useEffect, useState } from "react";
import { isEmbeddedApp } from "../utils/embeddedApp.js";

const DISMISS_KEY = "perovo_pwa_install_dismissed";

function readStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  );
}

function readIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function readAndroid() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

export function usePwaInstall() {
  const embedded = isEmbeddedApp();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [isStandalone] = useState(readStandalone);
  const [isIos] = useState(readIos);
  const [isAndroid] = useState(readAndroid);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const canInstall = !embedded && Boolean(deferredPrompt) && !isStandalone && !dismissed;
  const showIosHint = !embedded && isIos && !isStandalone && !dismissed;
  const showAndroidHint = !embedded && isAndroid && !canInstall && !isStandalone && !dismissed;
  const showInstallUi =
    !embedded && !isStandalone && !dismissed && (canInstall || showIosHint || showAndroidHint);

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

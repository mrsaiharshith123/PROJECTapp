import { useCallback, useEffect, useState } from "react";
import { Body, Button, Caption, Screen } from "../ui/index.js";
import { useTranslation } from "../i18n/I18nProvider.js";
import {
  allEssentialPermissionsGranted,
  anyEssentialPermissionDenied,
  checkEssentialPermissions,
  isNativeCapacitorShell,
  openAndroidAppSettings,
  requestEssentialPermissions,
} from "../utils/nativePermissions.js";

const SKIP_KEY = "perovo_native_perms_skipped_v1";

/**
 * On native Android, explain and request runtime permissions before the main app.
 * Triggers system Allow/Deny dialogs — not manual Settings unless user denied.
 */
export default function NativePermissionGate({ children }) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(!isNativeCapacitorShell());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const refreshStatus = useCallback(async () => {
    const next = await checkEssentialPermissions();
    setStatus(next);
    setShowSettings(anyEssentialPermissionDenied(next));
    if (allEssentialPermissionsGranted(next)) {
      try {
        localStorage.removeItem(SKIP_KEY);
      } catch {
        /* ignore */
      }
      setReady(true);
    }
    return next;
  }, []);

  useEffect(() => {
    if (!isNativeCapacitorShell()) return undefined;

    let cancelled = false;

    (async () => {
      try {
        if (localStorage.getItem(SKIP_KEY) === "1") {
          if (!cancelled) setReady(true);
          return;
        }
      } catch {
        /* ignore */
      }

      const next = await checkEssentialPermissions();
      if (cancelled) return;

      if (allEssentialPermissionsGranted(next)) {
        setReady(true);
        return;
      }

      setStatus(next);
      setShowSettings(anyEssentialPermissionDenied(next));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onAllow = async () => {
    setBusy(true);
    try {
      await requestEssentialPermissions();
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const onContinue = () => {
    try {
      localStorage.setItem(SKIP_KEY, "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  };

  if (ready) return children;

  return (
    <Screen className="ct-perm-gate">
      <div className="ct-perm-gate-panel">
        <Body className="ct-perm-gate-title">{t("permissions.introTitle")}</Body>
        <Caption className="ct-perm-gate-body">{t("permissions.introBody")}</Caption>

        <ul className="ct-perm-gate-list">
          <li>
            <strong>{t("permissions.itemNotificationsTitle")}</strong>
            <span>{t("permissions.itemNotificationsBody")}</span>
            {status ? (
              <Caption className="ct-perm-gate-state">{t(`permissions.state.${status.notifications}`)}</Caption>
            ) : null}
          </li>
          <li>
            <strong>{t("permissions.itemCameraTitle")}</strong>
            <span>{t("permissions.itemCameraBody")}</span>
            {status ? (
              <Caption className="ct-perm-gate-state">{t(`permissions.state.${status.camera}`)}</Caption>
            ) : null}
          </li>
          <li>
            <strong>{t("permissions.itemPhotosTitle")}</strong>
            <span>{t("permissions.itemPhotosBody")}</span>
            {status ? (
              <Caption className="ct-perm-gate-state">{t(`permissions.state.${status.photos}`)}</Caption>
            ) : null}
          </li>
        </ul>

        {showSettings ? (
          <Caption className="ct-perm-gate-denied">{t("permissions.deniedHint")}</Caption>
        ) : null}

        <div className="ct-perm-gate-actions">
          <Button type="button" variant="primary" size="md" disabled={busy} onClick={onAllow}>
            {busy ? t("permissions.requesting") : t("permissions.allowAccess")}
          </Button>
          {showSettings ? (
            <Button type="button" variant="outline" size="md" disabled={busy} onClick={openAndroidAppSettings}>
              {t("permissions.openSettings")}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="md" disabled={busy} onClick={onContinue}>
            {t("permissions.continueWithout")}
          </Button>
        </div>
      </div>
    </Screen>
  );
}

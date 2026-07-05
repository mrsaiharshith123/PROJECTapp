import { useCallback, useEffect, useState } from "react";
import { Body, Button, Caption } from "../../../index.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import {
  allEssentialPermissionsGranted,
  anyEssentialPermissionDenied,
  checkEssentialPermissions,
  isNativeCapacitorShell,
  openAndroidAppSettings,
  requestEssentialPermissions,
} from "../../../../utils/nativePermissions.js";
import YouSubPageShell from "./YouSubPageShell.jsx";

/** Manage notifications, camera, photos, and location on native Android. */
export default function YouPermissionsPage() {
  const { t } = useTranslation();
  const native = isNativeCapacitorShell();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const refreshStatus = useCallback(async () => {
    const next = await checkEssentialPermissions();
    setStatus(next);
    setShowSettings(anyEssentialPermissionDenied(next));
    return next;
  }, []);

  useEffect(() => {
    if (!native) return undefined;
    queueMicrotask(() => refreshStatus());
    return undefined;
  }, [native, refreshStatus]);

  const onAllow = async () => {
    setBusy(true);
    try {
      await requestEssentialPermissions();
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  if (!native) {
    return (
      <YouSubPageShell titleKey="settings.row.appPermissions">
        <Caption>{t("permissions.settingsWebOnly")}</Caption>
      </YouSubPageShell>
    );
  }

  const allGranted = status ? allEssentialPermissionsGranted(status) : false;

  return (
    <YouSubPageShell titleKey="settings.row.appPermissions">
      <div className="ed-inset" style={{ maxWidth: "none" }}>
        <Caption style={{ fontSize: 13, color: "var(--ed-ink-soft)" }}>{t("permissions.introBody")}</Caption>

        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0" }}>
          <li>
            <strong>{t("permissions.itemNotificationsTitle")}</strong>
            <span>{t("permissions.itemNotificationsBody")}</span>
            {status ? (
              <Caption style={{ fontSize: 12, color: "var(--ed-ink-faint)" }}>{t(`permissions.state.${status.notifications}`)}</Caption>
            ) : null}
          </li>
          <li>
            <strong>{t("permissions.itemCameraTitle")}</strong>
            <span>{t("permissions.itemCameraBody")}</span>
            {status ? (
              <Caption style={{ fontSize: 12, color: "var(--ed-ink-faint)" }}>{t(`permissions.state.${status.camera}`)}</Caption>
            ) : null}
          </li>
          <li>
            <strong>{t("permissions.itemPhotosTitle")}</strong>
            <span>{t("permissions.itemPhotosBody")}</span>
            {status ? (
              <Caption style={{ fontSize: 12, color: "var(--ed-ink-faint)" }}>{t(`permissions.state.${status.photos}`)}</Caption>
            ) : null}
          </li>
          <li>
            <strong>{t("permissions.itemLocationTitle")}</strong>
            <span>{t("permissions.itemLocationBody")}</span>
            {status ? (
              <Caption style={{ fontSize: 12, color: "var(--ed-ink-faint)" }}>{t(`permissions.state.${status.location}`)}</Caption>
            ) : null}
          </li>
        </ul>

        {showSettings ? (
          <Caption style={{ fontSize: 12, color: "var(--ed-amber)" }}>{t("permissions.deniedHint")}</Caption>
        ) : null}

        {allGranted ? (
          <Body style={{ textAlign: "center", color: "var(--ed-teal)" }}>{t("permissions.allGranted")}</Body>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          <Button type="button" variant="primary" size="md" disabled={busy} onClick={onAllow}>
            {busy ? t("permissions.requesting") : t("permissions.allowAccess")}
          </Button>
          {showSettings ? (
            <Button type="button" variant="outline" size="md" disabled={busy} onClick={openAndroidAppSettings}>
              {t("permissions.openSettings")}
            </Button>
          ) : null}
        </div>
      </div>
    </YouSubPageShell>
  );
}

import { useEffect, useState } from "react";
import { Caption } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isEmbeddedApp } from "../../../utils/embeddedApp.js";
import {
  resolveNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
  registerPeriodicReminderSync,
  requestServiceWorkerReminderFlush,
} from "../../../services/notifications/index.js";
import { SettingsGroup, SettingsGroupContent, SettingsGroupToggleRow } from "./SettingsGroup.jsx";

export default function ProfileNotificationsSection({ settings, updateSettings }) {
  const { t } = useTranslation();
  const { pushInAppNotification } = usePerovo();
  const supported = isNotificationSupported();
  const embedded = isEmbeddedApp();
  const [perm, setPerm] = useState("default");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolveNotificationPermission().then((p) => {
      if (!cancelled) setPerm(p);
    });
    return () => {
      cancelled = true;
    };
  }, [busy, status]);

  const handleEnable = async () => {
    setBusy(true);
    setStatus(null);
    const result = await requestNotificationPermission();
    setPerm(result);
    setBusy(false);
    if (result === "granted") {
      if (!embedded) await registerPeriodicReminderSync();
      setStatus({ type: "ok", text: t(embedded ? "notifications.enabledOkNative" : "notifications.enabledOk") });
    } else if (result === "denied") {
      setStatus({ type: "err", text: t(embedded ? "notifications.deniedErrNative" : "notifications.deniedErr") });
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setStatus(null);
    const result = await sendTestNotification();
    setPerm(await resolveNotificationPermission());

    if (result.ok) {
      if (!embedded) await requestServiceWorkerReminderFlush();
      pushInAppNotification({
        id: `test-${Date.now()}`,
        message: t("notifications.testInApp"),
        urgency: "normal",
      });
      setStatus({ type: "ok", text: t("notifications.testOk") });
    } else if (result.reason === "denied" || result.reason === "blocked") {
      setStatus({ type: "err", text: t(embedded ? "notifications.testDeniedNative" : "notifications.testDenied") });
    } else if (result.reason === "unsupported") {
      setStatus({ type: "err", text: t("notifications.testUnsupported") });
    } else {
      setStatus({ type: "err", text: t("notifications.testFail") });
    }
    setBusy(false);
  };

  return (
    <SettingsGroup title={t("notifications.title")} icon="bell" description={t("notifications.subtitle")}>
      <SettingsGroupToggleRow
        icon="bell"
        iconColor="amber"
        label={t("notifications.billReminders")}
        checked={settings.remindersEnabled !== false}
        onChange={(e) => updateSettings({ remindersEnabled: e.target.checked })}
      />

      {supported ? (
        <SettingsGroupContent className="ct-stack-sm">
          <div className="ct-stat-tile teal ct-stack-sm !p-3">
            <Caption>
              {t("notifications.permission")}: <span className="font-semibold capitalize">{perm}</span>
            </Caption>
            <div className="ct-row-wrap">
              {perm !== "granted" && (
                <button type="button" className="ct-btn ct-btn-primary ct-btn-sm" disabled={busy} onClick={handleEnable}>
                  {t(embedded ? "notifications.enableAlertsNative" : "notifications.enableAlerts")}
                </button>
              )}
              <button type="button" className="ct-btn ct-btn-outline ct-btn-sm" disabled={busy} onClick={handleTest}>
                {busy ? t("common.sending") : t("notifications.sendTest")}
              </button>
            </div>
            {status && (
              <Caption className={status.type === "ok" ? "text-[var(--ct-success)]" : "text-[var(--ct-warning)]"}>
                {status.text}
              </Caption>
            )}
            {!embedded ? (
              <Caption className="block opacity-80 leading-relaxed">{t("notifications.installHint")}</Caption>
            ) : (
              <Caption className="block opacity-80 leading-relaxed">{t("notifications.nativeHint")}</Caption>
            )}
          </div>
        </SettingsGroupContent>
      ) : (
        <SettingsGroupContent>
          <Caption>{t("notifications.unsupported")}</Caption>
        </SettingsGroupContent>
      )}
    </SettingsGroup>
  );
}

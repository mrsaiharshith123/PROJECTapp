import { useState } from "react";
import { Caption, Button } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isEmbeddedApp } from "../../../utils/embeddedApp.js";
import {
  getNotificationPermission,
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
  const [, setPermRefresh] = useState(0);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const perm = supported ? getNotificationPermission() : "unsupported";
  const bumpPerm = () => setPermRefresh((n) => n + 1);

  const handleEnable = async () => {
    setBusy(true);
    setStatus(null);
    const result = await requestNotificationPermission();
    bumpPerm();
    setBusy(false);
    if (result === "granted") {
      await registerPeriodicReminderSync();
      setStatus({ type: "ok", text: t("notifications.enabledOk") });
    } else if (result === "denied") {
      setStatus({ type: "err", text: t("notifications.deniedErr") });
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setStatus(null);
    const result = await sendTestNotification();
    bumpPerm();

    if (result.ok) {
      await requestServiceWorkerReminderFlush();
      pushInAppNotification({
        id: `test-${Date.now()}`,
        message: t("notifications.testInApp"),
        urgency: "normal",
      });
      setStatus({ type: "ok", text: t("notifications.testOk") });
    } else if (result.reason === "denied" || result.reason === "blocked") {
      setStatus({ type: "err", text: t("notifications.testDenied") });
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
          <div className="ct-hero-inset ct-stack-sm !p-3 rounded-[var(--ct-radius)]">
            <Caption>
              {t("notifications.permission")}: <span className="font-semibold capitalize">{perm}</span>
            </Caption>
            <div className="ct-row-wrap">
              {perm !== "granted" && (
                <Button type="button" size="sm" disabled={busy} onClick={handleEnable}>
                  {t("notifications.enableAlerts")}
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleTest}>
                {busy ? t("common.sending") : t("notifications.sendTest")}
              </Button>
            </div>
            {status && (
              <Caption className={status.type === "ok" ? "text-[var(--ct-success)]" : "text-[var(--ct-warning)]"}>
                {status.text}
              </Caption>
            )}
            {!embedded ? (
              <Caption className="block opacity-80 leading-relaxed">{t("notifications.installHint")}</Caption>
            ) : null}
          </div>
        </SettingsGroupContent>
      ) : (
        <SettingsGroupContent>
          <Caption>{t("notifications.unsupported")}</Caption>
        </SettingsGroupContent>
      )}

      <SettingsGroupContent className="!pt-0">
        <Button type="button" variant="ghost" className="w-full" onClick={() => updateSettings({ readNotificationIds: [] })}>
          {t("notifications.markRead")}
        </Button>
      </SettingsGroupContent>
    </SettingsGroup>
  );
}

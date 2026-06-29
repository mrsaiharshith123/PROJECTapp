import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import YouSubPageShell from "./YouSubPageShell.jsx";

/** Bill reminders and digest preferences. */
export default function YouNotificationsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const remindersOn = settings.remindersEnabled !== false;

  const toggles = [
    {
      key: "remindersEnabled",
      label: t("settings.row.reminders"),
      hint: t("notifications.remindersHint"),
      value: remindersOn,
      onChange: () => updateSettings({ remindersEnabled: !remindersOn }),
    },
    {
      key: "overdueAlerts",
      label: t("notifications.overdueAlerts"),
      hint: t("notifications.overdueAlertsHint"),
      value: settings.overdueAlerts !== false,
      onChange: () => updateSettings({ overdueAlerts: !(settings.overdueAlerts !== false) }),
    },
    {
      key: "weeklyDigest",
      label: t("notifications.weeklyDigest"),
      hint: t("notifications.weeklyDigestHint"),
      value: Boolean(settings.weeklyDigest),
      onChange: () => updateSettings({ weeklyDigest: !settings.weeklyDigest }),
    },
  ];

  return (
    <YouSubPageShell titleKey="settings.row.reminders">
      <div className="ed-you-section" style={{ borderBottom: "none" }}>
        <div className="ed-ins-kicker">{t("notifications.preferencesKicker")}</div>
        {toggles.map((tog) => (
          <div key={tog.key} className="ed-you-toggle-row">
            <div>
              <div className="ed-you-toggle-label">{tog.label}</div>
              <div className="ed-you-toggle-hint">{tog.hint}</div>
            </div>
            <label style={{ flexShrink: 0, marginLeft: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={tog.value}
                onChange={tog.onChange}
                style={{ width: 18, height: 18, accentColor: "var(--ed-gold)", cursor: "pointer" }}
              />
            </label>
          </div>
        ))}
      </div>
    </YouSubPageShell>
  );
}

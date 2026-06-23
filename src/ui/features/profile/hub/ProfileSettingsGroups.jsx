import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { isEmbeddedApp } from "../../../../utils/embeddedApp.js";
import { SettingsGroup, SettingsGroupRow } from "../SettingsGroup.jsx";
import ProfileUpdateAppRow from "../ProfileUpdateAppRow.jsx";

/**
 * Inline settings groups on the You tab — rows navigate to /you/* sub-pages.
 * @param {{
 *   settings: object,
 *   updateSettings: (p: object) => void,
 *   privacyMode?: boolean,
 *   onTogglePrivacyMode?: () => void,
 * }} props
 */
export default function ProfileSettingsGroups({
  settings,
  updateSettings,
  privacyMode = false,
  onTogglePrivacyMode,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const privacyValue = privacyMode ? t("settings.value.on") : t("settings.value.off");
  const remindersOn = settings.remindersEnabled !== false;
  const embedded = isEmbeddedApp();

  return (
    <div id="profile-settings" className="ct-profile-settings-groups ct-stack ct-reveal ct-reveal-delay-3">
      <SettingsGroup title={t("settings.group.account")} icon="user-circle">
        <SettingsGroupRow iconColor="indigo" icon="user" label={t("settings.row.personalDetails")} onClick={() => navigate("/you/personal")} />
        <SettingsGroupRow iconColor="indigo" icon="lock" label={t("settings.row.emailPassword")} onClick={() => navigate("/you/account")} />
        <SettingsGroupRow iconColor="gold" icon="crown" label={t("settings.row.subscription")} onClick={() => navigate("/you/plans")} />
        <SettingsGroupRow iconColor="indigo" icon="palette" label={t("settings.row.appearance")} onClick={() => navigate("/you/appearance")} />
      </SettingsGroup>

      <SettingsGroup title={t("settings.group.money")} icon="wallet">
        <SettingsGroupRow iconColor="teal" icon="currency-inr" label={t("settings.row.incomeSalary")} onClick={() => navigate("/you/money")} />
        <SettingsGroupRow iconColor="teal" icon="map-pin" label={t("settings.row.city")} onClick={() => navigate("/you/money")} />
        <SettingsGroupRow
          iconColor="teal"
          icon="clock-counter-clockwise"
          label={t("settings.row.paymentHistory")}
          onClick={() => navigate("/you/history")}
        />
      </SettingsGroup>

      <SettingsGroup title={t("settings.group.privacy")} icon="shield">
        <SettingsGroupRow
          iconColor="teal"
          icon="eye-slash"
          label={t("settings.row.privacyMode")}
          value={privacyValue}
          onClick={() => onTogglePrivacyMode?.()}
        />
        <SettingsGroupRow iconColor="teal" icon="device-mobile" label={t("settings.row.sessions")} onClick={() => navigate("/you/security")} />
        {embedded ? (
          <SettingsGroupRow
            iconColor="teal"
            icon="lock"
            label={t("profileHub.biometricLock")}
            value={settings.biometricLock ? t("settings.value.on") : t("settings.value.off")}
            onClick={() => updateSettings({ biometricLock: !settings.biometricLock })}
          />
        ) : null}
      </SettingsGroup>

      <SettingsGroup title={t("profileHub.group.dataBackup")} icon="cloud">
        <SettingsGroupRow iconColor="indigo" icon="cloud" label={t("settings.row.dataBackup")} onClick={() => navigate("/you/backup")} />
        <SettingsGroupRow iconColor="indigo" icon="clipboard-text" label={t("profileHub.exportData")} onClick={() => navigate("/you/backup")} />
      </SettingsGroup>

      <SettingsGroup title={t("settings.group.notifications")} icon="bell">
        <SettingsGroupRow
          iconColor="amber"
          icon="bell"
          label={t("profileHub.notifBills")}
          value={remindersOn ? t("settings.value.on") : t("settings.value.off")}
          onClick={() => navigate("/you/notifications")}
        />
        <SettingsGroupRow iconColor="amber" icon="handshake" label={t("profileHub.notifLending")} onClick={() => navigate("/you/notifications")} />
        <SettingsGroupRow iconColor="amber" icon="warning" label={t("profileHub.notifPressure")} onClick={() => navigate("/you/notifications")} />
      </SettingsGroup>

      <SettingsGroup title={t("settings.group.support")} icon="chat-circle">
        <ProfileUpdateAppRow />
        <SettingsGroupRow iconColor="violet" icon="book-open" label={t("settings.row.help")} onClick={() => navigate("/you/support")} />
        <SettingsGroupRow iconColor="violet" icon="lock" label={t("settings.row.privacyPolicy")} onClick={() => navigate("/you/support")} />
        <SettingsGroupRow iconColor="slate" icon="info" label={t("settings.row.about", { appName: t("brand.appName") })} onClick={() => navigate("/you/about")} />
      </SettingsGroup>

    </div>
  );
}

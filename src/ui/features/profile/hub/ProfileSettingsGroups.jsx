import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { isEmbeddedApp } from "../../../../utils/embeddedApp.js";
import { SettingsGroup, SettingsGroupRow } from "../SettingsGroup.jsx";
import ProfileUpdateAppRow from "../ProfileUpdateAppRow.jsx";

/**
 * Settings list on the You tab — Groww-style: few groups, one row per destination.
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
        <SettingsGroupRow
          iconColor="indigo"
          icon="user"
          label={t("settings.row.personalDetails")}
          hint={t("settings.row.personalDetailsHint")}
          onClick={() => navigate("/you/personal")}
        />
        <SettingsGroupRow iconColor="gold" icon="crown" label={t("settings.row.subscription")} onClick={() => navigate("/you/plans")} />
        <SettingsGroupRow iconColor="indigo" icon="palette" label={t("settings.row.appearance")} onClick={() => navigate("/you/appearance")} />
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
        <SettingsGroupRow
          iconColor="amber"
          icon="bell"
          label={t("settings.row.reminders")}
          value={remindersOn ? t("settings.value.on") : t("settings.value.off")}
          onClick={() => navigate("/you/notifications")}
        />
        <SettingsGroupRow iconColor="indigo" icon="cloud" label={t("settings.row.dataBackup")} onClick={() => navigate("/you/backup")} />
        <SettingsGroupRow
          iconColor="teal"
          icon="clock-counter-clockwise"
          label={t("settings.row.paymentHistory")}
          onClick={() => navigate("/you/history")}
        />
      </SettingsGroup>

      <SettingsGroup title={t("settings.group.support")} icon="chat-circle">
        <ProfileUpdateAppRow />
        <SettingsGroupRow iconColor="violet" icon="book-open" label={t("settings.row.help")} onClick={() => navigate("/you/support")} />
        <SettingsGroupRow iconColor="slate" icon="info" label={t("settings.row.about", { appName: t("brand.appName") })} onClick={() => navigate("/you/about")} />
      </SettingsGroup>
    </div>
  );
}

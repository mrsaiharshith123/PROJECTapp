import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Caption } from "../../../index.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { isSalariedFamily } from "../../../../constants/modeExperience.js";
import { SettingsGroup, SettingsGroupRow } from "../SettingsGroup.jsx";
import PlansModal from "../PlansModal.jsx";

/** @typedef {{ id: string, labelKey: string, icon?: string, panelId?: string, danger?: boolean, action?: string }} SettingsRowDef */

const PANEL_LABEL_KEYS = {
  "personal-identity": "settings.row.personalDetails",
  "personal-account": "settings.row.emailPassword",
  "personal-appearance": "settings.row.appearance",
  "personal-money": "settings.row.incomeSalary",
  "household-mode": "settings.row.householdMode",
  "history": "settings.row.paymentHistory",
  "security-sessions": "settings.row.sessions",
  backup: "settings.row.dataBackup",
  notifications: "settings.row.reminders",
  guide: "settings.row.help",
  support: "settings.row.about",
};

/** @param {string | null} openId */
function panelLabelKey(openId) {
  if (!openId) return "profileHub.settingsTitle";
  return PANEL_LABEL_KEYS[openId] || `profileHub.panel.${openId}`;
}

/**
 * App settings in a sheet — grouped rows per UI spec.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   openId: string | null,
 *   onSelect: (id: string | null) => void,
 *   renderPanel: (id: string) => import('react').ReactNode,
 *   settings: object,
 *   isLoggedIn?: boolean,
 *   privacyMode?: boolean,
 *   onTogglePrivacyMode?: () => void,
 *   onSignOut?: () => void | Promise<void>,
 *   onDeleteData?: () => void,
 *   signingOut?: boolean,
 * }} props
 */
export default function ProfileSettingsSheet({
  open,
  onClose,
  openId,
  onSelect,
  renderPanel,
  settings,
  isLoggedIn = false,
  privacyMode = false,
  onTogglePrivacyMode,
  onSignOut,
  onDeleteData,
  signingOut = false,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [plansOpen, setPlansOpen] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    onSelect(null);
    onClose();
  };

  const isFamily = isSalariedFamily(settings);
  const householdValue = isFamily ? t("settings.value.family") : t("settings.value.single");
  const remindersOn = settings.remindersEnabled !== false;
  const privacyValue = privacyMode ? t("settings.value.on") : t("settings.value.off");
  const smartNotifValue = remindersOn ? t("settings.value.on") : t("settings.value.off");

  const openPanel = (panelId) => onSelect(panelId);

  const title = openId ? t(panelLabelKey(openId)) : t("profileHub.settingsTitle");

  return (
    <>
      <Modal title={title} onClose={handleClose}>
        {!openId ? (
          <div className="ct-stack">
            <Caption className="block">{t("profileHub.settingsSubtitle")}</Caption>

            <SettingsGroup title={t("settings.group.account")} icon="user-circle">
              <SettingsGroupRow iconColor="violet" icon="user" label={t("settings.row.personalDetails")} onClick={() => openPanel("personal-identity")} />
              <SettingsGroupRow iconColor="violet" icon="lock" label={t("settings.row.emailPassword")} onClick={() => openPanel("personal-account")} />
              <SettingsGroupRow iconColor="violet" icon="target" label={t("settings.row.subscription")} onClick={() => setPlansOpen(true)} />
              <SettingsGroupRow iconColor="violet" icon="palette" label={t("settings.row.appearance")} onClick={() => openPanel("personal-appearance")} />
            </SettingsGroup>

            <SettingsGroup title={t("settings.group.money")} icon="wallet">
              <SettingsGroupRow iconColor="teal" icon="currency-inr" label={t("settings.row.incomeSalary")} onClick={() => openPanel("personal-money")} />
              <SettingsGroupRow iconColor="teal" icon="users-three" label={t("settings.row.householdMode")} value={householdValue} onClick={() => openPanel("household-mode")} />
              <SettingsGroupRow iconColor="teal" icon="push-pin" label={t("settings.row.city")} onClick={() => openPanel("personal-account")} />
              <SettingsGroupRow iconColor="teal" icon="arrows-clockwise" label={t("settings.row.paymentHistory")} onClick={() => openPanel("history")} />
            </SettingsGroup>

            <SettingsGroup title={t("settings.group.privacy")} icon="shield">
              <SettingsGroupRow iconColor="teal" icon="eye-slash" label={t("settings.row.privacyMode")} value={privacyValue} onClick={() => onTogglePrivacyMode?.()} />
              <SettingsGroupRow iconColor="teal" icon="device-mobile" label={t("settings.row.sessions")} onClick={() => openPanel("security-sessions")} />
              <SettingsGroupRow iconColor="teal" icon="cloud" label={t("settings.row.dataBackup")} onClick={() => openPanel("backup")} />
            </SettingsGroup>

            <SettingsGroup title={t("settings.group.notifications")} icon="bell">
              <SettingsGroupRow
                icon="bell"
                iconColor="amber"
                label={t("settings.row.reminders")}
                onClick={() => openPanel("notifications")}
              />
              <SettingsGroupRow
                icon="lightning"
                iconColor="amber"
                label={t("settings.row.smartNotifications")}
                value={smartNotifValue}
                onClick={() => openPanel("notifications")}
              />
            </SettingsGroup>

            <SettingsGroup title={t("settings.group.support")} icon="chat-circle">
              <SettingsGroupRow icon="book-open" iconColor="violet" label={t("settings.row.help")} onClick={() => openPanel("guide")} />
              <SettingsGroupRow
                icon="file-text"
                iconColor="teal"
                label={t("settings.row.privacyPolicy")}
                onClick={() => {
                  handleClose();
                  navigate("/privacy");
                }}
              />
              <SettingsGroupRow icon="scroll" iconColor="slate" label={t("settings.row.about", { appName: t("brand.appName") })} onClick={() => openPanel("support")} />
            </SettingsGroup>

            <SettingsGroup title={t("settings.group.danger")} icon="warning">
              {isLoggedIn ? (
                <SettingsGroupRow
                  icon="arrows-clockwise"
                  iconColor="red"
                  label={t("settings.row.signOut")}
                  danger
                  disabled={signingOut}
                  onClick={() => onSignOut?.()}
                />
              ) : null}
              <SettingsGroupRow
                icon="warning"
                iconColor="red"
                label={t("settings.row.deleteData")}
                danger
                onClick={() => onDeleteData?.()}
              />
            </SettingsGroup>
          </div>
        ) : (
          <div className="ct-stack">
            <button
              type="button"
              className="ct-btn ct-btn-ghost ct-btn-sm !w-auto self-start"
              onClick={() => onSelect(null)}
            >
              ← {t("profileHub.settingsBack")}
            </button>
            <div className="ct-profile-accordion-panel">{renderPanel(openId)}</div>
          </div>
        )}
      </Modal>

      <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} />
    </>
  );
}

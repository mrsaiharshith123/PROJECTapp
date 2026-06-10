import { useNavigate } from "react-router-dom";
import { Modal } from "../../../primitives/Modal.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { Caption } from "../../../primitives/Text.jsx";
import { ToolTile } from "../../ToolTile.jsx";

const PROFILE_CONTROL_GROUPS = [
  {
    id: "account",
    icon: "user",
    titleKey: "profileHub.group.account",
    hintKey: "profileHub.group.accountHint",
    panels: ["personal-identity", "personal-account", "personal-security"],
  },
  {
    id: "financial",
    icon: "currency-inr",
    titleKey: "profileHub.group.financial",
    hintKey: "profileHub.group.financialHint",
    panels: ["personal-money", "history"],
  },
  {
    id: "notifications",
    icon: "bell",
    titleKey: "profileHub.group.notifications",
    hintKey: "profileHub.group.notificationsHint",
    panels: ["notifications"],
  },
  {
    id: "privacy",
    icon: "lock",
    titleKey: "profileHub.group.privacy",
    hintKey: "profileHub.group.privacyHint",
    panels: ["backup"],
    privacyLink: true,
  },
  {
    id: "appearance",
    icon: "palette",
    titleKey: "profileHub.group.appearance",
    hintKey: "profileHub.group.appearanceHint",
    panels: ["personal-appearance"],
  },
  {
    id: "help",
    icon: "chat-circle",
    titleKey: "profileHub.group.help",
    hintKey: "profileHub.group.helpHint",
    panels: ["guide", "support"],
  },
];

/** @param {string | null} openId */
function profileGroupForPanel(openId) {
  if (!openId) return null;
  return PROFILE_CONTROL_GROUPS.find((g) => g.panels.includes(openId)) || null;
}

/**
 * App settings in a sheet — opened from the profile hero gear, not inline on the page.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   openId: string | null,
 *   onSelect: (id: string | null) => void,
 *   renderPanel: (id: string) => import('react').ReactNode,
 * }} props
 */
export default function ProfileSettingsSheet({ open, onClose, openId, onSelect, renderPanel }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeGroup = profileGroupForPanel(openId);

  if (!open) return null;

  const handleClose = () => {
    onSelect(null);
    onClose();
  };

  const title = openId && activeGroup ? t(activeGroup.titleKey) : t("profileHub.settingsTitle");

  return (
    <Modal title={title} onClose={handleClose}>
      {!openId || !activeGroup ? (
        <div className="ct-profile-settings-grid">
          <Caption className="block mb-3">{t("profileHub.settingsSubtitle")}</Caption>
          <div className="ct-profile-modules-grid">
            {PROFILE_CONTROL_GROUPS.map((group) => (
              <ToolTile
                key={group.id}
                icon={group.icon}
                title={t(group.titleKey)}
                onClick={() => onSelect(group.panels[0])}
                className="ct-profile-module-tile ct-profile-module-tile-compact"
              />
            ))}
          </div>
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
          <Caption className="block">{t(activeGroup.hintKey)}</Caption>
          {activeGroup.panels.length > 1 && (
            <div className="ct-profile-subnav" role="tablist">
              {activeGroup.panels.map((panelId) => (
                <button
                  key={panelId}
                  type="button"
                  role="tab"
                  aria-selected={openId === panelId}
                  className={`ct-profile-subnav-btn${openId === panelId ? " ct-profile-subnav-active" : ""}`}
                  onClick={() => onSelect(panelId)}
                >
                  {t(`profileHub.panel.${panelId}`)}
                </button>
              ))}
            </div>
          )}
          <div className="ct-profile-accordion-panel">{renderPanel(openId)}</div>
          {activeGroup.privacyLink && (
            <button
              type="button"
              className="ct-btn ct-btn-ghost ct-btn-sm !w-auto"
              onClick={() => navigate("/privacy")}
            >
              {t("profileHub.openPrivacy")}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

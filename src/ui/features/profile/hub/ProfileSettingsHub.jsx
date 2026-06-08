import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { Heading, Caption } from "../../../primitives/Text.jsx";
import { profileGroupForPanel } from "./profileControlGroups.js";

/**
 * Expanded settings panel for the active control-center tile.
 * @param {{
 *   openId: string | null,
 *   onSelect: (id: string | null) => void,
 *   renderPanel: (id: string) => import('react').ReactNode,
 * }} props
 */
export default function ProfileSettingsHub({ openId, onSelect, renderPanel }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeGroup = profileGroupForPanel(openId);
  if (!openId || !activeGroup) return null;

  return (
    <section className="ct-profile-settings ct-reveal ct-reveal-delay-4">
      <div className="ct-profile-settings-panel">
        <div className="ct-row-between mb-3">
          <div>
            <Heading level={3}>{t(activeGroup.titleKey)}</Heading>
            <Caption className="block">{t(activeGroup.hintKey)}</Caption>
          </div>
          <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm !w-auto shrink-0" onClick={() => onSelect(null)}>
            {t("profileHub.closePanel")}
          </button>
        </div>
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
            className="ct-btn ct-btn-ghost ct-btn-sm !w-auto mt-2"
            onClick={() => navigate("/privacy")}
          >
            {t("profileHub.openPrivacy")}
          </button>
        )}
      </div>
    </section>
  );
}

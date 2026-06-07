import { useTranslation } from "../../../../i18n/I18nProvider.jsx";
import { ToolTile } from "../../ToolTile.jsx";
import { Heading } from "../../../primitives/Text.jsx";
import { PROFILE_CONTROL_GROUPS, profileGroupForPanel } from "./profileControlGroups.js";

/**
 * @param {{
 *   openId: string | null,
 *   onSelect: (id: string | null) => void,
 * }} props
 */
export default function ProfileControlCenterGrid({ openId, onSelect }) {
  const { t } = useTranslation();
  const activeGroup = profileGroupForPanel(openId);

  return (
    <section className="ct-profile-modules ct-reveal ct-reveal-delay-3">
      <div className="ct-profile-section-head">
        <Heading level={3}>{t("profileHub.settingsTitle")}</Heading>
      </div>
      <div className="ct-profile-modules-grid">
        {PROFILE_CONTROL_GROUPS.map((group) => (
          <ToolTile
            key={group.id}
            icon={group.icon}
            title={t(group.titleKey)}
            onClick={() => {
              if (activeGroup?.id === group.id) onSelect(null);
              else onSelect(group.panels[0]);
            }}
            className={`ct-profile-module-tile ct-profile-module-tile-compact${activeGroup?.id === group.id ? " ct-profile-module-tile-active" : ""}`}
          />
        ))}
      </div>
    </section>
  );
}

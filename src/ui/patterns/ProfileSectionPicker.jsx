import { SettingsRow } from "./SettingsRow.jsx";
import { useTranslation } from "../../i18n/I18nProvider.jsx";

const SECTIONS = [
  { id: "personal", icon: "👤", labelKey: "profile.personal", hintKey: "profile.sectionPersonalHint" },
  { id: "guide", icon: "📖", labelKey: "profile.guidance", hintKey: "profile.sectionGuideHint" },
  { id: "notifications", icon: "🔔", labelKey: "profile.notifications", hintKey: "profile.sectionNotificationsHint" },
  { id: "backup", icon: "☁️", labelKey: "profile.backup", hintKey: "profile.sectionBackupHint" },
  { id: "history", icon: "📜", labelKey: "profile.history", hintKey: "profile.sectionHistoryHint" },
  { id: "support", icon: "💬", labelKey: "profile.support", hintKey: "profile.sectionSupportHint" },
];

/**
 * @param {{
 *   openId: string | null,
 *   onSelect: (id: string | null) => void,
 *   renderPanel?: (id: string) => import('react').ReactNode,
 * }} props
 */
export function ProfileSectionPicker({ openId, onSelect, renderPanel }) {
  const { t } = useTranslation();

  return (
    <div className="ct-settings-group">
      <p className="ct-settings-group-title">{t("profile.settingsGroup")}</p>
      {SECTIONS.map((s) => (
        <div key={s.id} className="ct-settings-section">
          <SettingsRow
            icon={s.icon}
            label={t(s.labelKey)}
            hint={t(s.hintKey)}
            active={openId === s.id}
            onClick={() => onSelect(openId === s.id ? null : s.id)}
          />
          {openId === s.id && renderPanel ? (
            <div className="ct-settings-panel">{renderPanel(s.id)}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default ProfileSectionPicker;

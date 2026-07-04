import { SettingsRow } from "./SettingsRow.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";

const SECTIONS = [
  { id: "personal", icon: "user", labelKey: "profile.personal", hintKey: "profile.sectionPersonalHint" },
  { id: "guide", icon: "book", labelKey: "profile.guidance", hintKey: "profile.sectionGuideHint" },
  { id: "notifications", icon: "bell", labelKey: "profile.notifications", hintKey: "profile.sectionNotificationsHint" },
  { id: "backup", icon: "cloud", labelKey: "profile.backup", hintKey: "profile.sectionBackupHint" },
  { id: "history", icon: "scroll", labelKey: "profile.history", hintKey: "profile.sectionHistoryHint" },
  { id: "support", icon: "chat-circle", labelKey: "profile.support", hintKey: "profile.sectionSupportHint" },
];

/**
 * @param {{ openId: string | null, onSelect: (id: string | null) => void }} props
 */
export function ProfileSectionPicker({ openId, onSelect }) {
  const { t } = useTranslation();
  return (
    <div className="ed-stack-sm">
      {SECTIONS.map((s) => (
        <SettingsRow
          key={s.id}
          icon={s.icon}
          label={t(s.labelKey)}
          hint={t(s.hintKey)}
          active={openId === s.id}
          onClick={() => onSelect(openId === s.id ? null : s.id)}
        />
      ))}
    </div>
  );
}

export default ProfileSectionPicker;

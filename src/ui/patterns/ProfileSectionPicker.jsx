import { SettingsRow } from "./SettingsRow.jsx";

const SECTIONS = [
  { id: "guide", icon: "📖", label: "App guide", hint: "Tutorial & setup replay" },
  { id: "personal", icon: "👤", label: "Personal & money", hint: "Name, income, mode, appearance" },
  { id: "backup", icon: "☁️", label: "Backup & data", hint: "Account backup, import, export" },
  { id: "notifications", icon: "🔔", label: "Notifications", hint: "Reminders & alerts" },
  { id: "history", icon: "📜", label: "Payment history", hint: "Past bills & edits" },
];

/**
 * @param {{
 *   openId: string | null,
 *   onSelect: (id: string | null) => void,
 *   renderPanel?: (id: string) => import('react').ReactNode,
 * }} props
 */
export function ProfileSectionPicker({ openId, onSelect, renderPanel }) {
  return (
    <div className="ct-settings-group">
      <p className="ct-settings-group-title">Profile settings</p>
      {SECTIONS.map((s) => (
        <div key={s.id} className="ct-settings-section">
          <SettingsRow
            icon={s.icon}
            label={s.label}
            hint={s.hint}
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

import { Body, Caption } from "../primitives/Text.jsx";

const SECTIONS = [
  { id: "guide", label: "App guide", hint: "Tutorial & setup replay" },
  { id: "personal", label: "Personal Information", hint: "Name, mode, household" },
  { id: "money", label: "Money Setup", hint: "Income, currency, budgets" },
  { id: "notifications", label: "Notifications", hint: "Reminders & alerts" },
  { id: "cloud", label: "CommitTrack Cloud", hint: "Optional sync & backup" },
  { id: "security", label: "Local data & export", hint: "Device storage, JSON" },
  { id: "import", label: "Import Data", hint: "File or cloud restore" },
  { id: "history", label: "Payment History", hint: "Past bills & edits" },
];

export function ProfileSectionPicker({ openId, onSelect }) {
  return (
    <div className="ct-grid-2">
      {SECTIONS.map((s) => {
        const active = openId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(active ? null : s.id)}
            className={`ct-list-row text-left ${active ? "ct-settings-tile-active" : ""}`}
          >
            <Body className={`font-semibold block ${active ? "ct-text-accent" : ""}`}>{s.label}</Body>
            <Caption className="block mt-0.5">{s.hint}</Caption>
          </button>
        );
      })}
    </div>
  );
}

export default ProfileSectionPicker;

import { Body, Caption } from "../primitives/Text.jsx";

/**
 * Profile / settings list row (mockup style with chevron).
 * @param {{ icon?: string, label: string, hint?: string, onClick: () => void, active?: boolean }} props
 */
export function SettingsRow({ icon, label, hint, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ct-list-row w-full text-left ${active ? "ct-settings-tile-active" : ""}`}
    >
      <div className="ct-row min-w-0 flex-1 gap-3">
        {icon && <span className="ct-icon-box">{icon}</span>}
        <div className="min-w-0">
          <Body className={`font-semibold block truncate ${active ? "ct-text-accent" : ""}`}>{label}</Body>
          {hint && <Caption className="block truncate mt-0.5">{hint}</Caption>}
        </div>
      </div>
      <span className="ct-settings-chevron" aria-hidden>
        ›
      </span>
    </button>
  );
}

export default SettingsRow;
